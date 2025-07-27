package api

import (
	"database/sql"
	"net/http"
	"time"

	"chinese-learning/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// QuizHandler handles quiz-related HTTP requests
type QuizHandler struct {
	vocabRepo *models.VocabularyRepository
	db        *sql.DB
}

// NewQuizHandler creates a new quiz handler
func NewQuizHandler(db *sql.DB) *QuizHandler {
	return &QuizHandler{
		vocabRepo: models.NewVocabularyRepository(db),
		db:        db,
	}
}

// GenerateQuiz handles POST /api/v1/quiz/generate
func (h *QuizHandler) GenerateQuiz(c *gin.Context) {
	var req models.QuizRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body: " + err.Error(),
		})
		return
	}

	// Set default count to 10 if not specified
	if req.Count <= 0 {
		req.Count = 10
	}

	// Get random vocabulary
	vocabulary, err := h.vocabRepo.GetRandom(req.Count, req.HSKLevel)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate quiz",
		})
		return
	}

	// Convert vocabulary to quiz cards
	var cards []models.QuizCard
	for _, vocab := range vocabulary {
		exampleSentences, _ := vocab.GetExampleSentences()
		card := models.QuizCard{
			ID:               vocab.ID,
			Chinese:          vocab.Chinese,
			Pinyin:           vocab.Pinyin,
			English:          vocab.English,
			HSKLevel:         vocab.HSKLevel,
			ExampleSentences: exampleSentences,
			ShowPinyin:       false,
			ShowAnswer:       false,
		}
		cards = append(cards, card)
	}

	// Create quiz
	quiz := models.Quiz{
		ID:        uuid.New(),
		Type:      req.Type,
		Cards:     cards,
		Total:     len(cards),
		CreatedAt: time.Now(),
	}

	c.JSON(http.StatusOK, quiz)
}

// SubmitQuiz handles POST /api/v1/quiz/submit
func (h *QuizHandler) SubmitQuiz(c *gin.Context) {
	var submission models.QuizSubmission
	if err := c.ShouldBindJSON(&submission); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body: " + err.Error(),
		})
		return
	}

	// For now, we'll just return a mock result
	// In a real implementation, you'd validate answers against the database
	result := models.QuizResult{
		QuizID:      submission.QuizID,
		Total:       10,
		Correct:     8, // Mock data
		Score:       80.0,
		Percentage:  80.0,
		CompletedAt: time.Now(),
	}

	c.JSON(http.StatusOK, result)
}

// GetQuizHistory handles GET /api/v1/quiz/history
func (h *QuizHandler) GetQuizHistory(c *gin.Context) {
	// For now, return mock history data
	// In a real implementation, you'd fetch from the database
	history := []models.QuizHistory{
		{
			ID:          uuid.New(),
			Type:        models.QuizTypeScored,
			Total:       10,
			Correct:     8,
			Score:       80.0,
			Percentage:  80.0,
			HSKLevel:    &[]int{1}[0],
			CreatedAt:   time.Now().Add(-24 * time.Hour),
			CompletedAt: time.Now().Add(-24 * time.Hour),
		},
		{
			ID:          uuid.New(),
			Type:        models.QuizTypePractice,
			Total:       10,
			Correct:     6,
			Score:       60.0,
			Percentage:  60.0,
			HSKLevel:    &[]int{1}[0],
			CreatedAt:   time.Now().Add(-48 * time.Hour),
			CompletedAt: time.Now().Add(-48 * time.Hour),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"history": history,
		"total":   len(history),
	})
}
