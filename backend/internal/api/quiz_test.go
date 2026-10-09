package api

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"chinese-learning/internal/models"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestGenerateQuiz(t *testing.T) {
	tests := []struct {
		name           string
		requestBody    models.QuizRequest
		mockSetup      func(*MockQuizVocabularyRepository)
		expectedStatus int
		expectedBody   map[string]interface{}
	}{
		{
			name: "successful practice quiz generation",
			requestBody: models.QuizRequest{
				Type:  models.QuizTypePractice,
				Count: 5,
			},
			mockSetup: func(mockRepo *MockQuizVocabularyRepository) {
				vocabulary := []models.Vocabulary{
					{
						ID:       uuid.New(),
						Chinese:  "你好",
						Pinyin:   "nǐ hǎo",
						English:  "hello",
						HSKLevel: 1,
					},
					{
						ID:       uuid.New(),
						Chinese:  "谢谢",
						Pinyin:   "xiè xie",
						English:  "thank you",
						HSKLevel: 1,
					},
				}
				mockRepo.On("GetRandom", 5, (*int)(nil)).Return(vocabulary, nil)
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"id":         mock.Anything,
				"type":       "practice",
				"cards":      mock.Anything,
				"total":      float64(2),
				"created_at": mock.Anything,
			},
		},
		{
			name: "successful scored quiz generation with HSK level",
			requestBody: models.QuizRequest{
				Type:     models.QuizTypeScored,
				Count:    10,
				HSKLevel: &[]int{2}[0],
			},
			mockSetup: func(mockRepo *MockQuizVocabularyRepository) {
				level := 2
				vocabulary := []models.Vocabulary{
					{
						ID:       uuid.New(),
						Chinese:  "学习",
						Pinyin:   "xué xí",
						English:  "to study",
						HSKLevel: 2,
					},
				}
				mockRepo.On("GetRandom", 10, &level).Return(vocabulary, nil)
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"id":         mock.Anything,
				"type":       "scored",
				"cards":      mock.Anything,
				"total":      float64(1),
				"created_at": mock.Anything,
			},
		},
		{
			name: "request with zero count - should default to 10",
			requestBody: models.QuizRequest{
				Type:  models.QuizTypePractice,
				Count: 0,
			},
			mockSetup: func(mockRepo *MockQuizVocabularyRepository) {
				vocabulary := []models.Vocabulary{}
				mockRepo.On("GetRandom", 10, (*int)(nil)).Return(vocabulary, nil)
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"id":         mock.Anything,
				"type":       "practice",
				"cards":      mock.Anything,
				"total":      float64(0),
				"created_at": mock.Anything,
			},
		},
		{
			name: "database error",
			requestBody: models.QuizRequest{
				Type:  models.QuizTypePractice,
				Count: 5,
			},
			mockSetup: func(mockRepo *MockQuizVocabularyRepository) {
				mockRepo.On("GetRandom", 5, (*int)(nil)).Return(nil, sql.ErrConnDone)
			},
			expectedStatus: http.StatusInternalServerError,
			expectedBody: map[string]interface{}{
				"error": "Failed to generate quiz",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler, mockRepo := MockQuizHandler()
			tt.mockSetup(mockRepo)

			router := setupTestRouter()
			router.POST("/quiz/generate", handler.GenerateQuiz)

			body, _ := json.Marshal(tt.requestBody)
			req, _ := http.NewRequest("POST", "/quiz/generate", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)

			if tt.expectedStatus == http.StatusOK {
				assert.Equal(t, tt.expectedBody["type"], response["type"])
				assert.Equal(t, tt.expectedBody["total"], response["total"])
				assert.Contains(t, response, "id")
				assert.Contains(t, response, "cards")
				assert.Contains(t, response, "created_at")
			} else {
				assert.Equal(t, tt.expectedBody, response)
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestGenerateQuizInvalidRequest(t *testing.T) {
	tests := []struct {
		name           string
		requestBody    string
		expectedStatus int
		expectedBody   map[string]interface{}
	}{
		{
			name:           "invalid JSON",
			requestBody:    `{"type": "practice", "count": 5`,
			expectedStatus: http.StatusBadRequest,
			expectedBody: map[string]interface{}{
				"error": mock.Anything,
			},
		},
		{
			name:           "missing required field",
			requestBody:    `{"count": 5}`,
			expectedStatus: http.StatusBadRequest,
			expectedBody: map[string]interface{}{
				"error": mock.Anything,
			},
		},
		{
			name:           "invalid quiz type",
			requestBody:    `{"type": "invalid", "count": 5}`,
			expectedStatus: http.StatusBadRequest,
			expectedBody: map[string]interface{}{
				"error": mock.Anything,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler, _ := MockQuizHandler()

			router := setupTestRouter()
			router.POST("/quiz/generate", handler.GenerateQuiz)

			req, _ := http.NewRequest("POST", "/quiz/generate", bytes.NewBufferString(tt.requestBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Contains(t, response, "error")
		})
	}
}

func TestSubmitQuiz(t *testing.T) {
	quizID := uuid.New()

	tests := []struct {
		name           string
		requestBody    models.QuizSubmission
		expectedStatus int
		expectedBody   map[string]interface{}
	}{
		{
			name: "successful quiz submission",
			requestBody: models.QuizSubmission{
				QuizID: quizID,
				Answers: map[string]string{
					quizID.String(): "hello",
				},
				Completed: true,
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"quiz_id":      quizID.String(),
				"total":        float64(1),
				"correct":      float64(1),
				"score":        float64(100.0),
				"percentage":   float64(100.0),
				"completed_at": mock.Anything,
			},
		},
		{
			name: "incomplete quiz submission",
			requestBody: models.QuizSubmission{
				QuizID: quizID,
				Answers: map[string]string{
					quizID.String(): "hello",
				},
				Completed: false,
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"quiz_id":      quizID.String(),
				"total":        float64(1),
				"correct":      float64(1),
				"score":        float64(100.0),
				"percentage":   float64(100.0),
				"completed_at": mock.Anything,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler, _ := MockQuizHandler()

			router := setupTestRouter()
			router.POST("/quiz/submit", handler.SubmitQuiz)

			body, _ := json.Marshal(tt.requestBody)
			req, _ := http.NewRequest("POST", "/quiz/submit", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)

			assert.Equal(t, tt.expectedBody["quiz_id"], response["quiz_id"])
			assert.Equal(t, tt.expectedBody["total"], response["total"])
			assert.Equal(t, tt.expectedBody["correct"], response["correct"])
			assert.Equal(t, tt.expectedBody["score"], response["score"])
			assert.Equal(t, tt.expectedBody["percentage"], response["percentage"])
			assert.Contains(t, response, "completed_at")
		})
	}
}

func TestSubmitQuizInvalidRequest(t *testing.T) {
	tests := []struct {
		name           string
		requestBody    string
		expectedStatus int
		expectedBody   map[string]interface{}
	}{
		{
			name:           "invalid JSON",
			requestBody:    `{"quiz_id": "123", "answers": {"123": "hello"}`,
			expectedStatus: http.StatusBadRequest,
			expectedBody: map[string]interface{}{
				"error": mock.Anything,
			},
		},
		{
			name:           "missing required field",
			requestBody:    `{"answers": {"123": "hello"}}`,
			expectedStatus: http.StatusBadRequest,
			expectedBody: map[string]interface{}{
				"error": mock.Anything,
			},
		},
		{
			name:           "invalid UUID",
			requestBody:    `{"quiz_id": "invalid-uuid", "answers": {"123": "hello"}}`,
			expectedStatus: http.StatusBadRequest,
			expectedBody: map[string]interface{}{
				"error": mock.Anything,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler, _ := MockQuizHandler()

			router := setupTestRouter()
			router.POST("/quiz/submit", handler.SubmitQuiz)

			req, _ := http.NewRequest("POST", "/quiz/submit", bytes.NewBufferString(tt.requestBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Contains(t, response, "error")
		})
	}
}

func TestGetQuizHistory(t *testing.T) {
	handler, _ := MockQuizHandler()

	router := setupTestRouter()
	router.GET("/quiz/history", handler.GetQuizHistory)

	req, _ := http.NewRequest("GET", "/quiz/history", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	assert.Contains(t, response, "history")
	assert.Contains(t, response, "total")
	assert.Equal(t, float64(2), response["total"])

	history, ok := response["history"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, history, 2)

	// Check first history item structure
	firstItem, ok := history[0].(map[string]interface{})
	assert.True(t, ok)
	assert.Contains(t, firstItem, "id")
	assert.Contains(t, firstItem, "type")
	assert.Contains(t, firstItem, "total")
	assert.Contains(t, firstItem, "correct")
	assert.Contains(t, firstItem, "score")
	assert.Contains(t, firstItem, "percentage")
	assert.Contains(t, firstItem, "created_at")
	assert.Contains(t, firstItem, "completed_at")
}

func TestSubmitQuiz_DailyActivity_Integration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	// This test requires a real database with migrations applied
	db := setupTestDB(t)
	defer db.Close()

	// Create a test user
	userID := uuid.New()
	_, err := db.Exec(`
		INSERT INTO users (id, email, password_hash, username, display_name, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
	`, userID, "test@example.com", "hash", "testuser", "Test User")
	assert.NoError(t, err)

	// Create test vocabulary
	vocabID := uuid.New()
	_, err = db.Exec(`
		INSERT INTO vocabulary (id, chinese, traditional, pinyin, pinyin_no_tones, english, hsk_level, created_at, updated_at)
		VALUES ($1, '测试', '測試', 'cè shì', 'ce shi', 'test', 1, NOW(), NOW())
	`, vocabID)
	assert.NoError(t, err)

	// Set up handlers and router
	vocabRepo := database.NewVocabularyRepository(db)
	quizRepo := database.NewQuizRepository(db)
	handler := NewQuizHandler(db, vocabRepo, quizRepo)

	router := gin.Default()
	router.Use(func(c *gin.Context) {
		c.Set("user_id", userID)
		c.Next()
	})
	router.POST("/submit", handler.SubmitQuiz)

	// Submit a quiz
	quizID := uuid.New()
	submission := models.QuizSubmission{
		QuizID:   quizID,
		QuizType: models.QuizTypePractice,
		HSKLevel: 1,
		Answers: map[string]string{
			vocabID.String(): "test",
		},
	}

	body, _ := json.Marshal(submission)
	req, _ := http.NewRequest("POST", "/submit", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Verify daily_activity was updated with quizzes_completed
	var quizzesCompleted int
	err = db.QueryRow(`
		SELECT COALESCE(quizzes_completed, 0) FROM daily_activity
		WHERE user_id = $1 AND activity_date = CURRENT_DATE
	`, userID).Scan(&quizzesCompleted)
	assert.NoError(t, err)
	assert.Equal(t, 1, quizzesCompleted, "Daily activity should record quiz completion")

	// Verify last_study_date was updated
	var lastStudyDate *string
	err = db.QueryRow(`
		SELECT to_char(last_study_date, 'YYYY-MM-DD') FROM users WHERE id = $1
	`, userID).Scan(&lastStudyDate)
	assert.NoError(t, err)
	assert.NotNil(t, lastStudyDate, "User last_study_date should be set")
}
