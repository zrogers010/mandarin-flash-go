package api

import (
	"database/sql"
	"net/http"
	"strconv"

	"chinese-learning/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// VocabularyHandler handles vocabulary-related HTTP requests
type VocabularyHandler struct {
	vocabRepo *models.VocabularyRepository
}

// NewVocabularyHandler creates a new vocabulary handler
func NewVocabularyHandler(db *sql.DB) *VocabularyHandler {
	return &VocabularyHandler{
		vocabRepo: models.NewVocabularyRepository(db),
	}
}

// GetVocabularyList handles GET /api/v1/vocabulary/
func (h *VocabularyHandler) GetVocabularyList(c *gin.Context) {
	// Parse query parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	search := c.Query("search")

	var hskLevel *int
	if levelStr := c.Query("hsk_level"); levelStr != "" {
		if level, err := strconv.Atoi(levelStr); err == nil && level >= 1 && level <= 6 {
			hskLevel = &level
		}
	}

	filters := models.VocabularyFilters{
		Page:     page,
		Limit:    limit,
		Search:   &search,
		HSKLevel: hskLevel,
	}

	// Get vocabulary from database
	result, err := h.vocabRepo.GetAll(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve vocabulary",
		})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetVocabularyItem handles GET /api/v1/vocabulary/:id
func (h *VocabularyHandler) GetVocabularyItem(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid vocabulary ID",
		})
		return
	}

	vocab, err := h.vocabRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve vocabulary item",
		})
		return
	}

	if vocab == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Vocabulary item not found",
		})
		return
	}

	c.JSON(http.StatusOK, vocab)
}

// GetHSKVocabulary handles GET /api/v1/vocabulary/hsk/:level
func (h *VocabularyHandler) GetHSKVocabulary(c *gin.Context) {
	levelStr := c.Param("level")
	level, err := strconv.Atoi(levelStr)
	if err != nil || level < 1 || level > 6 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid HSK level. Must be between 1 and 6",
		})
		return
	}

	vocabulary, err := h.vocabRepo.GetByHSKLevel(level)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve HSK vocabulary",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"hsk_level":  level,
		"vocabulary": vocabulary,
		"count":      len(vocabulary),
	})
}

// GetRandomVocabulary handles GET /api/v1/vocabulary/random
func (h *VocabularyHandler) GetRandomVocabulary(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit <= 0 || limit > 50 {
		limit = 10
	}

	var level *int
	if levelStr := c.Query("hsk_level"); levelStr != "" {
		if levelVal, err := strconv.Atoi(levelStr); err == nil && levelVal >= 1 && levelVal <= 6 {
			level = &levelVal
		}
	}

	vocabulary, err := h.vocabRepo.GetRandom(limit, level)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve random vocabulary",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"vocabulary": vocabulary,
		"count":      len(vocabulary),
		"limit":      limit,
		"hsk_level":  level,
	})
}
