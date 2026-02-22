package api

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"

	"chinese-learning/internal/config"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/polly"
	pollytypes "github.com/aws/aws-sdk-go-v2/service/polly/types"
	"github.com/gin-gonic/gin"
)

type TTSHandler struct {
	pollyClient *polly.Client
	enabled     bool
}

func NewTTSHandler(cfg *config.Config) *TTSHandler {
	h := &TTSHandler{}

	if cfg.Email.AWSRegion == "" {
		log.Println("[TTS] No AWS_REGION set — TTS disabled")
		return h
	}

	awsCfg, err := awsconfig.LoadDefaultConfig(context.Background(),
		awsconfig.WithRegion(cfg.Email.AWSRegion),
	)
	if err != nil {
		log.Printf("[TTS] WARNING: Failed to load AWS config: %v — TTS disabled", err)
		return h
	}

	h.pollyClient = polly.NewFromConfig(awsCfg)
	h.enabled = true
	log.Printf("[TTS] Amazon Polly enabled (region: %s)", cfg.Email.AWSRegion)
	return h
}

type ttsRequest struct {
	Text string `json:"text" binding:"required,max=500"`
	Lang string `json:"lang" binding:"required,oneof=zh en"`
}

func (h *TTSHandler) Synthesize(c *gin.Context) {
	if !h.enabled {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "TTS not configured"})
		return
	}

	var req ttsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: text (max 500 chars) and lang (zh or en) are required"})
		return
	}

	var voiceID pollytypes.VoiceId
	var langCode string
	var rate string
	if req.Lang == "zh" {
		voiceID = pollytypes.VoiceIdZhiyu
		langCode = "cmn-CN"
		rate = "75%"
	} else {
		voiceID = pollytypes.VoiceIdMatthew
		langCode = "en-US"
		rate = "85%"
	}

	ssml := fmt.Sprintf(`<speak><prosody rate="%s">%s</prosody></speak>`, rate, req.Text)

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
		log.Printf("[TTS] Polly error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Speech synthesis failed"})
		return
	}
	defer result.AudioStream.Close()

	c.Header("Content-Type", "audio/mpeg")
	c.Header("Cache-Control", "public, max-age=86400")
	c.Status(http.StatusOK)
	io.Copy(c.Writer, result.AudioStream)
}
