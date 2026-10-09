package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"chinese-learning/internal/models"
	
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestMergeGuestProgress_Integration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	// This test requires a real database with migrations applied
	// It will be run in CI where the database is set up
	db := setupTestDB(t)
	defer db.Close()

	// Create a test user
	userID := uuid.New()
	_, err := db.Exec(`
		INSERT INTO users (id, email, password_hash, username, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
	`, userID, "test@example.com", "hash", "testuser")
	assert.NoError(t, err)

	// Create test vocabulary
	vocabID := uuid.New()
	_, err = db.Exec(`
		INSERT INTO vocabulary (id, chinese, traditional, pinyin, pinyin_no_tones, english, hsk_level, created_at, updated_at)
		VALUES ($1, '测试', '測試', 'cè shì', 'ce shi', 'test', 1, NOW(), NOW())
	`, vocabID)
	assert.NoError(t, err)

	// Set up handler and router
	handler := NewGuestHandler(db)
	router := gin.Default()
	router.Use(func(c *gin.Context) {
		c.Set("user_id", userID)
		c.Next()
	})
	router.POST("/merge", handler.MergeGuestProgress)

	// Prepare guest data with seen words and quiz results
	guestData := models.GuestProgress{
		SeenWords: []string{vocabID.String()},
		QuizResults: []models.GuestQuizResult{
			{
				QuizType:  "practice",
				Total:     1,
				Correct:   1,
				Answers:   map[string]string{vocabID.String(): "test"},
				Timestamp: "2024-01-01T00:00:00Z",
			},
		},
	}

	requestBody := models.MergeGuestProgressRequest{
		GuestData: guestData,
	}

	body, _ := json.Marshal(requestBody)
	req, _ := http.NewRequest("POST", "/merge", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.Equal(t, float64(1), response["words_added"])
	assert.Equal(t, float64(1), response["quizzes_merged"])

	// Verify the word was actually inserted into user_vocabulary_progress
	var count int
	err = db.QueryRow(`
		SELECT COUNT(*) FROM user_vocabulary_progress
		WHERE user_id = $1 AND vocabulary_id = $2
	`, userID, vocabID).Scan(&count)
	assert.NoError(t, err)
	assert.Equal(t, 1, count, "Word should be inserted into user_vocabulary_progress")

	// Verify daily_activity was updated
	var quizzesCompleted int
	err = db.QueryRow(`
		SELECT COALESCE(cards_reviewed, 0) FROM daily_activity
		WHERE user_id = $1 AND activity_date = CURRENT_DATE
	`, userID).Scan(&quizzesCompleted)
	assert.NoError(t, err)
	assert.Equal(t, 1, quizzesCompleted, "Daily activity should record quiz merge")
}

func TestMergeGuestProgress_WithBadIDs_Integration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	// This test verifies robust handling of bad/nonexistent vocabulary IDs
	db := setupTestDB(t)
	defer db.Close()

	// Create a test user
	userID := uuid.New()
	_, err := db.Exec(`
		INSERT INTO users (id, email, password_hash, username, created_at, updated_at)
		VALUES ($1, $2, $3, $4, NOW(), NOW())
	`, userID, "test2@example.com", "hash", "testuser2")
	assert.NoError(t, err)

	// Create one valid vocabulary word
	goodVocabID := uuid.New()
	_, err = db.Exec(`
		INSERT INTO vocabulary (id, chinese, traditional, pinyin, pinyin_no_tones, english, hsk_level, created_at, updated_at)
		VALUES ($1, '好的', '好的', 'hǎo de', 'hao de', 'good', 1, NOW(), NOW())
	`, goodVocabID)
	assert.NoError(t, err)

	// Set up handler and router
	handler := NewGuestHandler(db)
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(func(c *gin.Context) {
		c.Set("user_id", userID)
		c.Next()
	})
	router.POST("/merge", handler.MergeGuestProgress)

	// Prepare guest data with mix of good and bad IDs
	badUUID := uuid.New().String()       // Valid UUID but doesn't exist in vocabulary
	invalidID := "not-a-uuid"            // Invalid UUID format
	
	guestData := models.GuestProgress{
		SeenWords: []string{
			invalidID,              // Should be skipped
			badUUID,                // Should be skipped (doesn't exist)
			goodVocabID.String(),   // Should be added
		},
		QuizResults: []models.GuestQuizResult{},
	}

	requestBody := models.MergeGuestProgressRequest{
		GuestData: guestData,
	}

	body, _ := json.Marshal(requestBody)
	req, _ := http.NewRequest("POST", "/merge", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Should return 200 with skipped count, not fail
	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	// Should have added only the good word
	assert.Equal(t, float64(1), response["words_added"], "Should add 1 valid word")
	assert.Equal(t, float64(2), response["words_skipped"], "Should skip 2 invalid IDs")

	// Verify only the good word was inserted
	var count int
	err = db.QueryRow(`
		SELECT COUNT(*) FROM user_vocabulary_progress
		WHERE user_id = $1
	`, userID).Scan(&count)
	assert.NoError(t, err)
	assert.Equal(t, 1, count, "Should have exactly 1 word in progress")

	// Verify it's the correct word
	var vocabID uuid.UUID
	err = db.QueryRow(`
		SELECT vocabulary_id FROM user_vocabulary_progress
		WHERE user_id = $1
	`, userID).Scan(&vocabID)
	assert.NoError(t, err)
	assert.Equal(t, goodVocabID, vocabID, "Should be the good vocabulary ID")
}
