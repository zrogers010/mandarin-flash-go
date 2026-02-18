package api

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"chinese-learning/internal/config"
	"chinese-learning/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestHealthCheck(t *testing.T) {
	router := setupTestRouter()
	router.GET("/health", healthCheck)

	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	expectedBody := map[string]interface{}{
		"status":  "healthy",
		"service": "chinese-learning-api",
		"version": "1.0.0",
	}
	assert.Equal(t, expectedBody, response)
}

func TestSearchDictionary(t *testing.T) {
	tests := []struct {
		name           string
		query          string
		expectedStatus int
		expectedBody   map[string]interface{}
	}{
		{
			name:           "successful search with query",
			query:          "你好",
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"message": "Search dictionary endpoint - to be implemented",
				"query":   "你好",
			},
		},
		{
			name:           "search with empty query",
			query:          "",
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"message": "Search dictionary endpoint - to be implemented",
				"query":   "",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := setupTestRouter()
			router.GET("/dictionary/search", searchDictionary)

			url := "/dictionary/search"
			if tt.query != "" {
				url += "?q=" + tt.query
			}

			req, _ := http.NewRequest("GET", url, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedBody, response)
		})
	}
}

func TestGetWordDefinition(t *testing.T) {
	tests := []struct {
		name           string
		word           string
		expectedStatus int
		expectedBody   map[string]interface{}
	}{
		{
			name:           "successful word definition request",
			word:           "你好",
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"message": "Get word definition endpoint - to be implemented",
				"word":    "你好",
			},
		},
		{
			name:           "word with special characters",
			word:           "谢谢",
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"message": "Get word definition endpoint - to be implemented",
				"word":    "谢谢",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			router := setupTestRouter()
			router.GET("/dictionary/:word", getWordDefinition)

			req, _ := http.NewRequest("GET", "/dictionary/"+tt.word, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedBody, response)
		})
	}
}

func TestSendChatMessage(t *testing.T) {
	router := setupTestRouter()
	router.POST("/chat/message", sendChatMessage)

	req, _ := http.NewRequest("POST", "/chat/message", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	expectedBody := map[string]interface{}{
		"message": "Send chat message endpoint - to be implemented",
	}
	assert.Equal(t, expectedBody, response)
}

func TestGetChatHistory(t *testing.T) {
	router := setupTestRouter()
	router.GET("/chat/history", getChatHistory)

	req, _ := http.NewRequest("GET", "/chat/history", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)

	expectedBody := map[string]interface{}{
		"message": "Get chat history endpoint - to be implemented",
	}
	assert.Equal(t, expectedBody, response)
}

func TestSetupRoutes(t *testing.T) {
	// Create a test database connection (we'll use nil since we're just testing route setup)
	var db *sql.DB
	var redisClient *redis.Client
	cfg := &config.Config{}

	router := gin.New()
	SetupRoutes(router, db, redisClient, cfg)

	// Test that the routes are properly set up by making requests to them
	tests := []struct {
		name           string
		method         string
		path           string
		expectedStatus int
	}{
		{
			name:           "health check route",
			method:         "GET",
			path:           "/api/v1/health",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "quiz history route",
			method:         "GET",
			path:           "/api/v1/quiz/history",
			expectedStatus: http.StatusOK, // This one returns mock data, so it should work
		},
		{
			name:           "dictionary search route",
			method:         "GET",
			path:           "/api/v1/dictionary/search?q=你好",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "dictionary word route",
			method:         "GET",
			path:           "/api/v1/dictionary/你好",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "chat message route",
			method:         "POST",
			path:           "/api/v1/chat/message",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "chat history route",
			method:         "GET",
			path:           "/api/v1/chat/history",
			expectedStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, _ := http.NewRequest(tt.method, tt.path, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			// We're just testing that the routes exist and don't return 404
			assert.NotEqual(t, http.StatusNotFound, w.Code)
		})
	}
}

func TestCORSHeaders(t *testing.T) {
	var db *sql.DB
	var redisClient *redis.Client
	cfg := &config.Config{}

	router := gin.New()
	SetupRoutes(router, db, redisClient, cfg)

	req, _ := http.NewRequest("GET", "/api/v1/health", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Check that CORS headers are present
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Header().Get("Access-Control-Allow-Origin"), "*")
	assert.Contains(t, w.Header().Get("Access-Control-Allow-Methods"), "GET")
	assert.Contains(t, w.Header().Get("Access-Control-Allow-Headers"), "Content-Type")
}

func TestVocabularyRoutesWithMockHandler(t *testing.T) {
	// Test vocabulary routes with a mock handler to avoid DB dependency
	handler, mockRepo := MockVocabularyHandler()

	// Setup mock expectations
	mockRepo.On("GetAll", mock.Anything).Return(&models.VocabularyListResponse{
		Vocabulary: []models.Vocabulary{},
		Total:      0,
		Page:       1,
		Limit:      20,
	}, nil)

	router := setupTestRouter()
	router.GET("/vocabulary", handler.GetVocabularyList)

	req, _ := http.NewRequest("GET", "/vocabulary", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}

func TestQuizRoutesWithMockHandler(t *testing.T) {
	// Test quiz routes with a mock handler to avoid DB dependency
	handler, mockRepo := MockQuizHandler()

	// Setup mock expectations for quiz generation
	vocabulary := []models.Vocabulary{
		{
			ID:       uuid.New(),
			Chinese:  "你好",
			Pinyin:   "nǐ hǎo",
			English:  "hello",
			HSKLevel: 1,
		},
	}
	mockRepo.On("GetRandom", 10, (*int)(nil)).Return(vocabulary, nil)

	router := setupTestRouter()
	router.POST("/quiz/generate", handler.GenerateQuiz)

	requestBody := models.QuizRequest{
		Type:  models.QuizTypePractice,
		Count: 10,
	}
	body, _ := json.Marshal(requestBody)

	req, _ := http.NewRequest("POST", "/quiz/generate", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	mockRepo.AssertExpectations(t)
}
