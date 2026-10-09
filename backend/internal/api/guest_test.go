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
