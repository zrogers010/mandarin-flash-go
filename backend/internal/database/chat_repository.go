package database

import (
	"database/sql"
	"encoding/json"
	"fmt"

	"chinese-learning/internal/models"

	"github.com/google/uuid"
)

// ChatRepository handles chat message persistence
type ChatRepository struct {
	db *sql.DB
}

// NewChatRepository creates a new chat repository
func NewChatRepository(db *sql.DB) *ChatRepository {
	return &ChatRepository{db: db}
}

// SaveMessage persists a chat message
func (r *ChatRepository) SaveMessage(msg *models.ChatMessage) error {
	query := `
		INSERT INTO chat_messages (id, user_id, conversation_id, role, content, metadata, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.db.Exec(query,
		msg.ID, msg.UserID, msg.ConversationID,
		msg.Role, msg.Content, msg.Metadata, msg.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to save chat message: %w", err)
	}
	return nil
}

// GetConversationMessages retrieves messages for a conversation
func (r *ChatRepository) GetConversationMessages(userID, conversationID uuid.UUID, limit int) ([]models.ChatMessage, error) {
	if limit <= 0 {
		limit = 50
	}

	query := `
		SELECT id, user_id, conversation_id, role, content, metadata, created_at
		FROM chat_messages
		WHERE user_id = $1 AND conversation_id = $2
		ORDER BY created_at ASC
		LIMIT $3
	`

	rows, err := r.db.Query(query, userID, conversationID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get conversation messages: %w", err)
	}
	defer rows.Close()

	var messages []models.ChatMessage
	for rows.Next() {
		var msg models.ChatMessage
		if err := rows.Scan(
			&msg.ID, &msg.UserID, &msg.ConversationID,
			&msg.Role, &msg.Content, &msg.Metadata, &msg.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan chat message: %w", err)
		}
		messages = append(messages, msg)
	}

	return messages, nil
}

// GetRecentMessages retrieves the most recent N messages for building context
func (r *ChatRepository) GetRecentMessages(userID, conversationID uuid.UUID, limit int) ([]models.ChatMessage, error) {
	query := `
		SELECT id, user_id, conversation_id, role, content, metadata, created_at
		FROM (
			SELECT id, user_id, conversation_id, role, content, metadata, created_at
			FROM chat_messages
			WHERE user_id = $1 AND conversation_id = $2
			ORDER BY created_at DESC
			LIMIT $3
		) sub
		ORDER BY created_at ASC
	`

	rows, err := r.db.Query(query, userID, conversationID, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get recent messages: %w", err)
	}
	defer rows.Close()

	var messages []models.ChatMessage
	for rows.Next() {
		var msg models.ChatMessage
		if err := rows.Scan(
			&msg.ID, &msg.UserID, &msg.ConversationID,
			&msg.Role, &msg.Content, &msg.Metadata, &msg.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("failed to scan chat message: %w", err)
		}
		messages = append(messages, msg)
	}

	return messages, nil
}

// GetConversations retrieves conversation summaries for a user
func (r *ChatRepository) GetConversations(userID uuid.UUID, limit, offset int) ([]models.Conversation, int, error) {
	if limit <= 0 {
		limit = 20
	}

	// Count total conversations
	var total int
	countQuery := `SELECT COUNT(DISTINCT conversation_id) FROM chat_messages WHERE user_id = $1`
	if err := r.db.QueryRow(countQuery, userID).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count conversations: %w", err)
	}

	query := `
		SELECT
			conversation_id,
			(SELECT content FROM chat_messages cm2
			 WHERE cm2.conversation_id = cm.conversation_id AND cm2.user_id = $1
			 ORDER BY created_at DESC LIMIT 1) as last_message,
			COUNT(*) as message_count,
			MIN(created_at) as created_at,
			MAX(created_at) as last_activity_at
		FROM chat_messages cm
		WHERE user_id = $1
		GROUP BY conversation_id
		ORDER BY MAX(created_at) DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get conversations: %w", err)
	}
	defer rows.Close()

	var conversations []models.Conversation
	for rows.Next() {
		var conv models.Conversation
		if err := rows.Scan(
			&conv.ID, &conv.LastMessage, &conv.MessageCount,
			&conv.CreatedAt, &conv.LastActivityAt,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan conversation: %w", err)
		}
		conversations = append(conversations, conv)
	}

	return conversations, total, nil
}

// SaveMessageMetadata is a helper to create metadata JSON
func SaveMessageMetadata(model string, tokensUsed int) json.RawMessage {
	meta := map[string]interface{}{
		"model":       model,
		"tokens_used": tokensUsed,
	}
	data, _ := json.Marshal(meta)
	return data
}
