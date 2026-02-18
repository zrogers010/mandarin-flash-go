package api

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	aiClient "chinese-learning/internal/ai"
	"chinese-learning/internal/config"
	"chinese-learning/internal/database"
	"chinese-learning/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ChatHandler handles AI chat endpoints
type ChatHandler struct {
	chatRepo *database.ChatRepository
	ai       *aiClient.Client
	db       *sql.DB
}

// NewChatHandler creates a new chat handler
func NewChatHandler(db *sql.DB, cfg *config.Config) *ChatHandler {
	return &ChatHandler{
		chatRepo: database.NewChatRepository(db),
		ai:       aiClient.NewClient(&cfg.AI),
		db:       db,
	}
}

// SendMessage handles POST /api/v1/chat/message
func (h *ChatHandler) SendMessage(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var req models.ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Check if AI is configured
	if !h.ai.IsConfigured() {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": "AI chat is not available. Please configure AI_API_KEY.",
		})
		return
	}

	// Determine conversation ID (new or existing)
	conversationID := uuid.New()
	if req.ConversationID != nil {
		conversationID = *req.ConversationID
	}

	// Save the user's message
	userMsg := &models.ChatMessage{
		ID:             uuid.New(),
		UserID:         userID,
		ConversationID: conversationID,
		Role:           models.ChatRoleUser,
		Content:        req.Message,
		CreatedAt:      time.Now(),
	}
	if err := h.chatRepo.SaveMessage(userMsg); err != nil {
		log.Printf("Failed to save user message: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save message"})
		return
	}

	// Build context from conversation history
	var aiMessages []aiClient.Message

	if req.ConversationID != nil {
		// Load recent conversation history for context (last 20 messages)
		history, err := h.chatRepo.GetRecentMessages(userID, conversationID, 20)
		if err != nil {
			log.Printf("Failed to load conversation history: %v", err)
			// Continue without history — not fatal
		} else {
			for _, msg := range history {
				// Skip the message we just saved (it's the latest)
				if msg.ID == userMsg.ID {
					continue
				}
				aiMessages = append(aiMessages, aiClient.Message{
					Role:    string(msg.Role),
					Content: msg.Content,
				})
			}
		}
	}

	// Add the current message
	aiMessages = append(aiMessages, aiClient.Message{
		Role:    "user",
		Content: req.Message,
	})

	// Call AI service
	aiResp, err := h.ai.ChatCompletion(aiMessages)
	if err != nil {
		log.Printf("AI API call failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get AI response. Please try again.",
		})
		return
	}

	assistantContent := aiResp.Choices[0].Message.Content

	// Build metadata
	meta, _ := json.Marshal(map[string]interface{}{
		"model":             aiResp.ID,
		"prompt_tokens":     aiResp.Usage.PromptTokens,
		"completion_tokens": aiResp.Usage.CompletionTokens,
		"total_tokens":      aiResp.Usage.TotalTokens,
	})

	// Save the assistant's response
	assistantMsg := &models.ChatMessage{
		ID:             uuid.New(),
		UserID:         userID,
		ConversationID: conversationID,
		Role:           models.ChatRoleAssistant,
		Content:        assistantContent,
		Metadata:       meta,
		CreatedAt:      time.Now(),
	}
	if err := h.chatRepo.SaveMessage(assistantMsg); err != nil {
		log.Printf("Failed to save assistant message: %v", err)
		// Still return the response to the user even if save fails
	}

	c.JSON(http.StatusOK, models.ChatResponse{
		Message:        assistantContent,
		ConversationID: conversationID,
		MessageID:      assistantMsg.ID,
	})
}

// GetHistory handles GET /api/v1/chat/history?conversation_id=...
func (h *ChatHandler) GetHistory(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	convIDStr := c.Query("conversation_id")
	if convIDStr != "" {
		// Get messages for a specific conversation
		convID, err := uuid.Parse(convIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid conversation_id"})
			return
		}

		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
		messages, err := h.chatRepo.GetConversationMessages(userID, convID, limit)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"messages":        messages,
			"conversation_id": convID,
			"count":           len(messages),
		})
		return
	}

	// No conversation_id: return list of conversations
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	conversations, total, err := h.chatRepo.GetConversations(userID, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch conversations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"conversations": conversations,
		"total":         total,
		"page":          page,
		"limit":         limit,
	})
}
