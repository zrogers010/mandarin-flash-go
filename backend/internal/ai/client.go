package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"chinese-learning/internal/config"
)

// Client is an OpenAI-compatible API client
type Client struct {
	cfg        *config.AIConfig
	httpClient *http.Client
}

// NewClient creates a new AI client
func NewClient(cfg *config.AIConfig) *Client {
	return &Client{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// IsConfigured returns whether the AI service has an API key set
func (c *Client) IsConfigured() bool {
	return c.cfg.APIKey != ""
}

// ═══════════════════════════════════════════════════════════════════
// OpenAI-compatible request/response types
// ═══════════════════════════════════════════════════════════════════

// Message represents a chat message in the API format
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatCompletionRequest is the request body for chat completions
type ChatCompletionRequest struct {
	Model       string    `json:"model"`
	Messages    []Message `json:"messages"`
	MaxTokens   int       `json:"max_tokens,omitempty"`
	Temperature float64   `json:"temperature,omitempty"`
}

// ChatCompletionResponse is the response from chat completions
type ChatCompletionResponse struct {
	ID      string `json:"id"`
	Choices []struct {
		Message      Message `json:"message"`
		FinishReason string  `json:"finish_reason"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
		TotalTokens      int `json:"total_tokens"`
	} `json:"usage"`
}

// ═══════════════════════════════════════════════════════════════════
// System prompt for Chinese language tutor
// ═══════════════════════════════════════════════════════════════════

const chineseTutorSystemPrompt = `You are MandarinFlash AI, a friendly and knowledgeable Chinese language tutor. You help students learn Mandarin Chinese at all levels (HSK 1-6).

Your capabilities:
- Explain Chinese vocabulary, grammar, and sentence structures
- Provide example sentences with pinyin and English translations
- Correct mistakes in Chinese text and explain the corrections
- Teach cultural context behind phrases and expressions
- Practice conversations in Chinese with the student
- Adapt your level of Chinese based on the student's proficiency

Guidelines:
- When showing Chinese text, always include pinyin and English translation
- Format Chinese examples like this: 你好 (nǐ hǎo) - Hello
- Use simple language for beginners, more complex for advanced learners
- Be encouraging and supportive
- If the student writes in Chinese, respond with both Chinese and English
- If the student asks about a specific HSK level, tailor your examples to that level
- Keep responses concise but informative
- Use bullet points and formatting for clarity when explaining grammar

You can communicate in both English and Chinese. Match the language the student uses.`

// ═══════════════════════════════════════════════════════════════════
// API Methods
// ═══════════════════════════════════════════════════════════════════

// ChatCompletion sends a chat completion request
func (c *Client) ChatCompletion(messages []Message) (*ChatCompletionResponse, error) {
	if !c.IsConfigured() {
		return nil, fmt.Errorf("AI service is not configured (missing AI_API_KEY)")
	}

	// Prepend system prompt
	allMessages := make([]Message, 0, len(messages)+1)
	allMessages = append(allMessages, Message{
		Role:    "system",
		Content: chineseTutorSystemPrompt,
	})
	allMessages = append(allMessages, messages...)

	reqBody := ChatCompletionRequest{
		Model:       c.cfg.Model,
		Messages:    allMessages,
		MaxTokens:   c.cfg.MaxTokens,
		Temperature: 0.7,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	url := c.cfg.BaseURL + "/chat/completions"
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.cfg.APIKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("AI API request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("AI API returned status %d: %s", resp.StatusCode, string(body))
	}

	var result ChatCompletionResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	if len(result.Choices) == 0 {
		return nil, fmt.Errorf("AI returned no choices")
	}

	return &result, nil
}

// GetSystemPrompt returns the system prompt (useful for testing)
func GetSystemPrompt() string {
	return chineseTutorSystemPrompt
}
