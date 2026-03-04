package api

import (
	"database/sql"
	"net/http"

	"chinese-learning/internal/database"
	"chinese-learning/internal/models"

	"github.com/gin-gonic/gin"
)

type LessonHandler struct {
	lessonRepo *database.LessonRepository
}

func NewLessonHandler(db *sql.DB) *LessonHandler {
	return &LessonHandler{
		lessonRepo: database.NewLessonRepository(db),
	}
}

func (h *LessonHandler) GetLessons(c *gin.Context) {
	category := c.Query("category")
	difficulty := c.Query("difficulty")

	lessons, err := h.lessonRepo.GetAll(category, difficulty)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch lessons",
		})
		return
	}

	if lessons == nil {
		lessons = []models.Lesson{}
	}

	c.JSON(http.StatusOK, gin.H{
		"lessons": lessons,
	})
}

func (h *LessonHandler) GetLessonBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Slug is required",
		})
		return
	}

	lesson, err := h.lessonRepo.GetBySlug(slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch lesson",
		})
		return
	}

	if lesson == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Lesson not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"lesson": lesson,
	})
}

func (h *LessonHandler) GetCategories(c *gin.Context) {
	categories, err := h.lessonRepo.GetCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch categories",
		})
		return
	}

	if categories == nil {
		categories = []string{}
	}

	c.JSON(http.StatusOK, gin.H{
		"categories": categories,
	})
}
