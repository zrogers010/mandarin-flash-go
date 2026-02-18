package api

import (
	"database/sql"
	"net/http"
	"strconv"

	"chinese-learning/internal/database"
	"chinese-learning/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// LearningHandler handles spaced repetition and learning progress endpoints
type LearningHandler struct {
	learningRepo *database.LearningRepository
	db           *sql.DB
}

// NewLearningHandler creates a new learning handler
func NewLearningHandler(db *sql.DB) *LearningHandler {
	return &LearningHandler{
		learningRepo: database.NewLearningRepository(db),
		db:           db,
	}
}

// GetReviewItems handles GET /api/v1/learn/review
// Returns vocabulary items due for spaced repetition review
func (h *LearningHandler) GetReviewItems(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	var hskLevel *int
	if lvStr := c.Query("hsk_level"); lvStr != "" {
		if lv, err := strconv.Atoi(lvStr); err == nil && lv >= 1 && lv <= 6 {
			hskLevel = &lv
		}
	}

	items, err := h.learningRepo.GetDueReviewItems(userID, hskLevel, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get review items"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": items,
		"count": len(items),
	})
}

// GetNewWords handles GET /api/v1/learn/new
// Returns vocabulary items the user hasn't studied yet
func (h *LearningHandler) GetNewWords(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	var hskLevel *int
	if lvStr := c.Query("hsk_level"); lvStr != "" {
		if lv, err := strconv.Atoi(lvStr); err == nil && lv >= 1 && lv <= 6 {
			hskLevel = &lv
		}
	}

	items, err := h.learningRepo.GetNewWordsForStudy(userID, hskLevel, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get new words"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": items,
		"count": len(items),
	})
}

// SubmitReview handles POST /api/v1/learn/review
// Processes a batch of review results and updates spaced repetition schedule
func (h *LearningHandler) SubmitReview(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	var submission models.ReviewBatchSubmission
	if err := c.ShouldBindJSON(&submission); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	if len(submission.Reviews) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No reviews submitted"})
		return
	}

	var results []models.UserVocabularyProgress
	for _, review := range submission.Reviews {
		prog, err := h.learningRepo.SubmitReview(userID, review.VocabularyID, review.Quality)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":         "Failed to process review",
				"vocabulary_id": review.VocabularyID,
			})
			return
		}
		results = append(results, *prog)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Reviews processed successfully",
		"processed": len(results),
		"results":   results,
	})
}

// GetLearningStats handles GET /api/v1/learn/stats
// Returns comprehensive learning statistics
func (h *LearningHandler) GetLearningStats(c *gin.Context) {
	userID := c.MustGet("user_id").(uuid.UUID)

	stats, err := h.learningRepo.GetLearningStats(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get learning statistics"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}
