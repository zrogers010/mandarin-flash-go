package api

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"chinese-learning/internal/config"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/polly"
	pollytypes "github.com/aws/aws-sdk-go-v2/service/polly/types"
	edge_tts "github.com/bytectlgo/edge-tts/pkg/edge_tts"
	"github.com/gin-gonic/gin"
)

type TTSHandler struct {
	pollyClient *polly.Client
	pollyOn     bool
}

// ssmlEscaper escapes characters that are special in SSML/XML so that
// user-supplied text cannot inject or break out of the SSML document.
var ssmlEscaper = strings.NewReplacer(
	"&", "&amp;",
	"<", "&lt;",
	">", "&gt;",
	`"`, "&quot;",
	"'", "&apos;",
)

func escapeSSML(s string) string {
	return ssmlEscaper.Replace(s)
}

func NewTTSHandler(cfg *config.Config) *TTSHandler {
	h := &TTSHandler{}

	if cfg.Email.AWSRegion == "" {
		log.Println("[TTS] No AWS_REGION set — using Microsoft Edge neural TTS fallback (XiaoxiaoNeural)")
		return h
	}

	awsCfg, err := awsconfig.LoadDefaultConfig(context.Background(),
		awsconfig.WithRegion(cfg.Email.AWSRegion),
	)
	if err != nil {
		log.Printf("[TTS] WARNING: Failed to load AWS config: %v — using Edge TTS fallback", err)
		return h
	}

	h.pollyClient = polly.NewFromConfig(awsCfg)
	h.pollyOn = true
	log.Printf("[TTS] Amazon Polly enabled (region: %s)", cfg.Email.AWSRegion)
	return h
}

type ttsRequest struct {
	Text string `json:"text" binding:"required,max=500"`
	Lang string `json:"lang" binding:"required,oneof=zh en"`
}

func (h *TTSHandler) Synthesize(c *gin.Context) {
	var req ttsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: text (max 500 chars) and lang (zh or en) are required"})
		return
	}

	if h.pollyOn {
		if err := h.synthesizePolly(c, req); err != nil {
			log.Printf("[TTS] Polly error: %v — falling back to Edge TTS", err)
			h.synthesizeEdgeTTS(c, req)
		}
		return
	}

	h.synthesizeEdgeTTS(c, req)
}

func (h *TTSHandler) synthesizePolly(c *gin.Context, req ttsRequest) error {
	var voiceID pollytypes.VoiceId
	var langCode string
	var rate string
	if req.Lang == "zh" {
		voiceID = pollytypes.VoiceIdZhiyu
		langCode = "cmn-CN"
		if len([]rune(req.Text)) <= 4 {
			rate = "90%"
		} else {
			rate = "80%"
		}
	} else {
		voiceID = pollytypes.VoiceIdMatthew
		langCode = "en-US"
		rate = "85%"
	}

	ssml := fmt.Sprintf(`<speak><prosody rate="%s">%s</prosody></speak>`, rate, escapeSSML(req.Text))

	input := &polly.SynthesizeSpeechInput{
		Text:         &ssml,
		TextType:     pollytypes.TextTypeSsml,
		OutputFormat: pollytypes.OutputFormatMp3,
		VoiceId:      voiceID,
		Engine:       pollytypes.EngineNeural,
		LanguageCode: pollytypes.LanguageCode(langCode),
	}

	result, err := h.pollyClient.SynthesizeSpeech(context.Background(), input)
	if err != nil {
		return err
	}
	defer result.AudioStream.Close()

	c.Header("Content-Type", "audio/mpeg")
	c.Header("Cache-Control", "public, max-age=86400")
	c.Status(http.StatusOK)
	io.Copy(c.Writer, result.AudioStream)
	return nil
}

func (h *TTSHandler) synthesizeEdgeTTS(c *gin.Context, req ttsRequest) {
	voice := "zh-CN-XiaoxiaoNeural"
	if req.Lang == "en" {
		voice = "en-US-GuyNeural"
	}

	var opts []edge_tts.Option
	if req.Lang == "zh" && len([]rune(req.Text)) <= 4 {
		opts = append(opts, edge_tts.WithRate("-20%"))
	}

	comm := edge_tts.NewCommunicate(req.Text, voice, opts...)
	stream, err := comm.Stream(c.Request.Context())
	if err != nil {
		log.Printf("[TTS] Edge TTS stream error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Speech synthesis failed"})
		return
	}

	var buf bytes.Buffer
	for chunk := range stream {
		if chunk.Type == "error" {
			log.Printf("[TTS] Edge TTS chunk error: %s", string(chunk.Data))
			if buf.Len() == 0 {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Speech synthesis failed"})
				return
			}
			break
		}
		if chunk.Type == "audio" {
			buf.Write(chunk.Data)
		}
	}

	if buf.Len() == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "No audio data received"})
		return
	}

	c.Header("Content-Type", "audio/mpeg")
	c.Header("Cache-Control", "public, max-age=86400")
	c.Status(http.StatusOK)
	c.Writer.Write(buf.Bytes())
}
