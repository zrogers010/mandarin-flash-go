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

func TestSetupRoutes(t *testing.T) {
	var db *sql.DB
	var redisClient *redis.Client
	cfg := &config.Config{
		CORS: config.CORSConfig{
			AllowedOrigins: []string{"http://localhost:3000"},
		},
	}

	router := gin.New()
	router.Use(gin.Recovery())
	SetupRoutes(router, db, redisClient, cfg)

	// Health check is the only route that works without a DB
	req, _ := http.NewRequest("GET", "/api/v1/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "healthy", response["status"])
}

func TestCORSHeaders(t *testing.T) {
	var db *sql.DB
	var redisClient *redis.Client
	cfg := &config.Config{
		CORS: config.CORSConfig{
			AllowedOrigins: []string{"http://localhost:3000"},
		},
	}

	router := gin.New()
	SetupRoutes(router, db, redisClient, cfg)

	// Send an OPTIONS preflight request to check CORS
	req, _ := http.NewRequest("OPTIONS", "/api/v1/health", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "GET")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNoContent, w.Code)
	assert.Equal(t, "http://localhost:3000", w.Header().Get("Access-Control-Allow-Origin"))
	assert.Contains(t, w.Header().Get("Access-Control-Allow-Methods"), "GET")
}

func TestVocabularyRoutesWithMockHandler(t *testing.T) {
	handler, mockRepo := MockVocabularyHandler()

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
	handler, mockRepo := MockQuizHandler()

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
