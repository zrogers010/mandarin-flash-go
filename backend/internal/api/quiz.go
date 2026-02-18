package api

import (
	"database/sql"
	"math/rand"
	"net/http"
	"strconv"
	"time"

	"chinese-learning/internal/database"
	"chinese-learning/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// QuizHandler handles quiz-related HTTP requests
type QuizHandler struct {
	vocabRepo *models.VocabularyRepository
	quizRepo  *database.QuizRepositoryImpl
	db        *sql.DB
}

// NewQuizHandler creates a new quiz handler
func NewQuizHandler(db *sql.DB) *QuizHandler {
	return &QuizHandler{
		vocabRepo: models.NewVocabularyRepository(db),
		quizRepo:  database.NewQuizRepository(db),
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

		// For scored quizzes, generate multiple choice options
		if req.Type == models.QuizTypeScored {
			wrongAnswers, err := h.vocabRepo.GetRandom(6, req.HSKLevel)
			if err == nil && len(wrongAnswers) >= 3 {
				options := []string{vocab.English}

				for _, wrong := range wrongAnswers {
					if wrong.ID != vocab.ID && wrong.English != vocab.English {
						options = append(options, wrong.English)
						if len(options) >= 4 {
							break
						}
					}
				}

				for len(options) < 4 {
					genericOptions := []string{"I don't know", "None of the above", "Maybe", "Not sure"}
					option := genericOptions[len(options)-1]
					if !contains(options, option) {
						options = append(options, option)
					}
				}

				shuffleStrings(options)

				card.MultipleChoice = options
				card.CorrectAnswer = vocab.English
			}
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

	// Validate each answer and calculate score
	correct := 0
	total := len(submission.Answers)

	var cardResults []models.CardResult

	for cardID, userAnswer := range submission.Answers {
		vocabID, err := uuid.Parse(cardID)
		if err != nil {
			continue
		}

		vocab, err := h.vocabRepo.GetByID(vocabID)
		if err == nil && vocab != nil {
			isCorrect := vocab.English == userAnswer
			if isCorrect {
				correct++
			}

			cardResults = append(cardResults, models.CardResult{
				CardID:        vocabID,
				UserAnswer:    userAnswer,
				CorrectAnswer: vocab.English,
				IsCorrect:     isCorrect,
			})
		}
	}

	score := 0.0
	percentage := 0.0
	if total > 0 {
		score = float64(correct) / float64(total) * 100
		percentage = score
	}

	result := models.QuizResult{
		QuizID:      submission.QuizID,
		Total:       total,
		Correct:     correct,
		Score:       score,
		Percentage:  percentage,
		CardResults: cardResults,
		CompletedAt: time.Now(),
	}

	// If user is authenticated, persist the quiz result to the database
	if userID, exists := c.Get("user_id"); exists {
		uid := userID.(uuid.UUID)

		record := &models.QuizResultRecord{
			ID:          uuid.New(),
			UserID:      uid,
			QuizType:    submission.QuizType,
			HSKLevel:    submission.HSKLevel,
			Total:       total,
			Correct:     correct,
			Score:       score,
			Percentage:  percentage,
			CardResults: cardResults,
			CreatedAt:   time.Now(),
			CompletedAt: time.Now(),
		}

		if err := h.quizRepo.SaveQuizResult(record); err != nil {
			// Log but don't fail the response — the user still sees their score
			// log.Printf("Failed to save quiz result: %v", err)
		}
	}

	c.JSON(http.StatusOK, result)
}

// GetQuizHistory handles GET /api/v1/quiz/history
func (h *QuizHandler) GetQuizHistory(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	uid := userID.(uuid.UUID)

	// Parse pagination params
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if limit <= 0 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	history, total, err := h.quizRepo.GetQuizHistory(uid, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch quiz history",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"history": history,
		"total":   total,
		"page":    page,
		"limit":   limit,
	})
}

// GetQuizStats handles GET /api/v1/quiz/stats
func (h *QuizHandler) GetQuizStats(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Authentication required",
		})
		return
	}

	uid := userID.(uuid.UUID)

	stats, err := h.quizRepo.GetQuizStats(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch quiz statistics",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}

// Helper function to check if a slice contains a string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// Helper function to shuffle a slice of strings
func shuffleStrings(slice []string) {
	for i := len(slice) - 1; i > 0; i-- {
		j := rand.Intn(i + 1)
		slice[i], slice[j] = slice[j], slice[i]
	}
}
