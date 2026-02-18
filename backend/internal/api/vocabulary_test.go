package api

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"chinese-learning/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func setupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.New()
}

func TestGetVocabularyList(t *testing.T) {
	tests := []struct {
		name           string
		queryParams    string
		mockSetup      func(*MockVocabularyRepository)
		expectedStatus int
		expectedBody   map[string]interface{}
	}{
		{
			name:        "successful request with default parameters",
			queryParams: "",
			mockSetup: func(mockRepo *MockVocabularyRepository) {
				expectedFilters := models.VocabularyFilters{
					Page:  1,
					Limit: 20,
				}
				mockRepo.On("GetAll", expectedFilters).Return(&models.VocabularyListResponse{
					Vocabulary: []models.Vocabulary{},
					Total:      0,
					Page:       1,
					Limit:      20,
				}, nil)
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"vocabulary": []interface{}{},
				"total":      float64(0),
				"page":       float64(1),
				"limit":      float64(20),
			},
		},
		{
			name:        "successful request with custom parameters",
			queryParams: "?page=2&limit=10&search=你好&hsk_level=1",
			mockSetup: func(mockRepo *MockVocabularyRepository) {
				search := "你好"
				level := 1
				expectedFilters := models.VocabularyFilters{
					Page:     2,
					Limit:    10,
					Search:   &search,
					HSKLevel: &level,
				}
				mockRepo.On("GetAll", expectedFilters).Return(&models.VocabularyListResponse{
					Vocabulary: []models.Vocabulary{},
					Total:      0,
					Page:       2,
					Limit:      10,
				}, nil)
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"vocabulary": []interface{}{},
				"total":      float64(0),
				"page":       float64(2),
				"limit":      float64(10),
			},
		},
		{
			name:        "database error",
			queryParams: "",
			mockSetup: func(mockRepo *MockVocabularyRepository) {
				expectedFilters := models.VocabularyFilters{
					Page:  1,
					Limit: 20,
				}
				mockRepo.On("GetAll", expectedFilters).Return(nil, sql.ErrConnDone)
			},
			expectedStatus: http.StatusInternalServerError,
			expectedBody: map[string]interface{}{
				"error": "Failed to retrieve vocabulary",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler, mockRepo := MockVocabularyHandler()
			tt.mockSetup(mockRepo)

			router := setupTestRouter()
			router.GET("/vocabulary", handler.GetVocabularyList)

			req, _ := http.NewRequest("GET", "/vocabulary"+tt.queryParams, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedBody, response)

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestGetVocabularyItem(t *testing.T) {
	validID := uuid.New()
	invalidID := "invalid-uuid"

	tests := []struct {
		name           string
		id             string
		mockSetup      func(*MockVocabularyRepository)
		expectedStatus int
		expectedBody   map[string]interface{}
	}{
		{
			name: "successful request",
			id:   validID.String(),
			mockSetup: func(mockRepo *MockVocabularyRepository) {
				vocab := &models.Vocabulary{
					ID:       validID,
					Chinese:  "你好",
					Pinyin:   "nǐ hǎo",
					English:  "hello",
					HSKLevel: 1,
				}
				mockRepo.On("GetByID", validID).Return(vocab, nil)
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"id":         validID.String(),
				"chinese":    "你好",
				"pinyin":     "nǐ hǎo",
				"english":    "hello",
				"hsk_level":  float64(1),
				"created_at": mock.Anything,
				"updated_at": mock.Anything,
			},
		},
		{
			name: "invalid UUID",
			id:   invalidID,
			mockSetup: func(mockRepo *MockVocabularyRepository) {
				// No mock setup needed for invalid UUID
			},
			expectedStatus: http.StatusBadRequest,
			expectedBody: map[string]interface{}{
				"error": "Invalid vocabulary ID",
			},
		},
		{
			name: "not found",
			id:   validID.String(),
			mockSetup: func(mockRepo *MockVocabularyRepository) {
				mockRepo.On("GetByID", validID).Return(nil, nil)
			},
			expectedStatus: http.StatusNotFound,
			expectedBody: map[string]interface{}{
				"error": "Vocabulary item not found",
			},
		},
		{
			name: "database error",
			id:   validID.String(),
			mockSetup: func(mockRepo *MockVocabularyRepository) {
				mockRepo.On("GetByID", validID).Return(nil, sql.ErrConnDone)
			},
			expectedStatus: http.StatusInternalServerError,
			expectedBody: map[string]interface{}{
				"error": "Failed to retrieve vocabulary item",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler, mockRepo := MockVocabularyHandler()
			tt.mockSetup(mockRepo)

			router := setupTestRouter()
			router.GET("/vocabulary/:id", handler.GetVocabularyItem)

			req, _ := http.NewRequest("GET", "/vocabulary/"+tt.id, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)

			// For successful responses, we need to check fields individually due to timestamps
			if tt.expectedStatus == http.StatusOK {
				assert.Equal(t, tt.expectedBody["id"], response["id"])
				assert.Equal(t, tt.expectedBody["chinese"], response["chinese"])
				assert.Equal(t, tt.expectedBody["pinyin"], response["pinyin"])
				assert.Equal(t, tt.expectedBody["english"], response["english"])
				assert.Equal(t, tt.expectedBody["hsk_level"], response["hsk_level"])
				assert.Contains(t, response, "created_at")
				assert.Contains(t, response, "updated_at")
			} else {
				assert.Equal(t, tt.expectedBody, response)
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestGetHSKVocabulary(t *testing.T) {
	tests := []struct {
		name           string
		level          string
		mockSetup      func(*MockVocabularyRepository)
		expectedStatus int
		expectedBody   map[string]interface{}
	}{
		{
			name:  "successful request",
			level: "1",
			mockSetup: func(mockRepo *MockVocabularyRepository) {
				vocabulary := []models.Vocabulary{
					{
						ID:       uuid.New(),
						Chinese:  "你好",
						Pinyin:   "nǐ hǎo",
						English:  "hello",
						HSKLevel: 1,
					},
				}
				mockRepo.On("GetByHSKLevel", 1).Return(vocabulary, nil)
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"hsk_level":  float64(1),
				"vocabulary": mock.Anything,
				"count":      float64(1),
			},
		},
		{
			name:  "invalid level - too low",
			level: "0",
			mockSetup: func(mockRepo *MockVocabularyRepository) {
				// No mock setup needed for invalid level
			},
			expectedStatus: http.StatusBadRequest,
			expectedBody: map[string]interface{}{
				"error": "Invalid HSK level. Must be between 1 and 6",
			},
		},
		{
			name:  "invalid level - too high",
			level: "7",
			mockSetup: func(mockRepo *MockVocabularyRepository) {
				// No mock setup needed for invalid level
			},
			expectedStatus: http.StatusBadRequest,
			expectedBody: map[string]interface{}{
				"error": "Invalid HSK level. Must be between 1 and 6",
			},
		},
		{
			name:  "invalid level - not a number",
			level: "abc",
			mockSetup: func(mockRepo *MockVocabularyRepository) {
				// No mock setup needed for invalid level
			},
			expectedStatus: http.StatusBadRequest,
			expectedBody: map[string]interface{}{
				"error": "Invalid HSK level. Must be between 1 and 6",
			},
		},
		{
			name:  "database error",
			level: "1",
			mockSetup: func(mockRepo *MockVocabularyRepository) {
				mockRepo.On("GetByHSKLevel", 1).Return(nil, sql.ErrConnDone)
			},
			expectedStatus: http.StatusInternalServerError,
			expectedBody: map[string]interface{}{
				"error": "Failed to retrieve HSK vocabulary",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler, mockRepo := MockVocabularyHandler()
			tt.mockSetup(mockRepo)

			router := setupTestRouter()
			router.GET("/vocabulary/hsk/:level", handler.GetHSKVocabulary)

			req, _ := http.NewRequest("GET", "/vocabulary/hsk/"+tt.level, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)

			if tt.expectedStatus == http.StatusOK {
				assert.Equal(t, tt.expectedBody["hsk_level"], response["hsk_level"])
				assert.Equal(t, tt.expectedBody["count"], response["count"])
				assert.Contains(t, response, "vocabulary")
			} else {
				assert.Equal(t, tt.expectedBody, response)
			}

			mockRepo.AssertExpectations(t)
		})
	}
}

func TestGetRandomVocabulary(t *testing.T) {
	tests := []struct {
		name           string
		queryParams    string
		mockSetup      func(*MockVocabularyRepository)
		expectedStatus int
		expectedBody   map[string]interface{}
	}{
		{
			name:        "successful request with default parameters",
			queryParams: "",
			mockSetup: func(mockRepo *MockVocabularyRepository) {
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
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"vocabulary": mock.Anything,
				"count":      float64(1),
				"limit":      float64(10),
				"hsk_level":  (*int)(nil),
			},
		},
		{
			name:        "successful request with custom parameters",
			queryParams: "?limit=5&hsk_level=2",
			mockSetup: func(mockRepo *MockVocabularyRepository) {
				level := 2
				vocabulary := []models.Vocabulary{
					{
						ID:       uuid.New(),
						Chinese:  "谢谢",
						Pinyin:   "xiè xie",
						English:  "thank you",
						HSKLevel: 2,
					},
				}
				mockRepo.On("GetRandom", 5, &level).Return(vocabulary, nil)
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"vocabulary": mock.Anything,
				"count":      float64(1),
				"limit":      float64(5),
				"hsk_level":  float64(2),
			},
		},
		{
			name:        "limit too high - should default to 10",
			queryParams: "?limit=100",
			mockSetup: func(mockRepo *MockVocabularyRepository) {
				vocabulary := []models.Vocabulary{}
				mockRepo.On("GetRandom", 10, (*int)(nil)).Return(vocabulary, nil)
			},
			expectedStatus: http.StatusOK,
			expectedBody: map[string]interface{}{
				"vocabulary": mock.Anything,
				"count":      float64(0),
				"limit":      float64(10),
				"hsk_level":  (*int)(nil),
			},
		},
		{
			name:        "database error",
			queryParams: "",
			mockSetup: func(mockRepo *MockVocabularyRepository) {
				mockRepo.On("GetRandom", 10, (*int)(nil)).Return(nil, sql.ErrConnDone)
			},
			expectedStatus: http.StatusInternalServerError,
			expectedBody: map[string]interface{}{
				"error": "Failed to retrieve random vocabulary",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler, mockRepo := MockVocabularyHandler()
			tt.mockSetup(mockRepo)

			router := setupTestRouter()
			router.GET("/vocabulary/random", handler.GetRandomVocabulary)

			req, _ := http.NewRequest("GET", "/vocabulary/random"+tt.queryParams, nil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			assert.NoError(t, err)

			if tt.expectedStatus == http.StatusOK {
				assert.Equal(t, tt.expectedBody["count"], response["count"])
				assert.Equal(t, tt.expectedBody["limit"], response["limit"])
				assert.Contains(t, response, "vocabulary")
				assert.Contains(t, response, "hsk_level")
			} else {
				assert.Equal(t, tt.expectedBody, response)
			}

			mockRepo.AssertExpectations(t)
		})
	}
}
