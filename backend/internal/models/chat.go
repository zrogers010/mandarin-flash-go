package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// ChatRole represents the role of a chat message sender
type ChatRole string

const (
	ChatRoleUser      ChatRole = "user"
	ChatRoleAssistant ChatRole = "assistant"
	ChatRoleSystem    ChatRole = "system"
)

// ChatMessage represents a single chat message stored in the database
type ChatMessage struct {
	ID             uuid.UUID       `json:"id" db:"id"`
	UserID         uuid.UUID       `json:"user_id" db:"user_id"`
	ConversationID uuid.UUID       `json:"conversation_id" db:"conversation_id"`
	Role           ChatRole        `json:"role" db:"role"`
	Content        string          `json:"content" db:"content"`
	Metadata       json.RawMessage `json:"metadata,omitempty" db:"metadata"`
	CreatedAt      time.Time       `json:"created_at" db:"created_at"`
}

// ChatRequest represents a request to send a chat message
type ChatRequest struct {
	Message        string     `json:"message" binding:"required"`
	ConversationID *uuid.UUID `json:"conversation_id,omitempty"` // nil = start new conversation
}

// ChatResponse represents the response from the AI
type ChatResponse struct {
	Message        string    `json:"message"`
	ConversationID uuid.UUID `json:"conversation_id"`
	MessageID      uuid.UUID `json:"message_id"`
}

// Conversation represents a conversation summary
type Conversation struct {
	ID             uuid.UUID `json:"id"`
	LastMessage    string    `json:"last_message"`
	MessageCount   int       `json:"message_count"`
	CreatedAt      time.Time `json:"created_at"`
	LastActivityAt time.Time `json:"last_activity_at"`
}
