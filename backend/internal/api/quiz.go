package api

import (
	"database/sql"
	"math/rand"
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

		// For scored quizzes, generate multiple choice options
		if req.Type == models.QuizTypeScored {
			// Get additional random vocabulary for wrong answers
			// We need more than 3 to ensure we have enough unique wrong answers
			wrongAnswers, err := h.vocabRepo.GetRandom(6, req.HSKLevel)
			if err == nil && len(wrongAnswers) >= 3 {
				// Create multiple choice options starting with correct answer
				options := []string{vocab.English} // Correct answer first

				// Add wrong answers, ensuring they're different from the correct answer
				for _, wrong := range wrongAnswers {
					if wrong.ID != vocab.ID && wrong.English != vocab.English {
						options = append(options, wrong.English)
						// Stop when we have 4 total options
						if len(options) >= 4 {
							break
						}
					}
				}

				// If we don't have enough wrong answers, add some generic options
				for len(options) < 4 {
					genericOptions := []string{"I don't know", "None of the above", "Maybe", "Not sure"}
					option := genericOptions[len(options)-1]
					if !contains(options, option) {
						options = append(options, option)
					}
				}

				// Shuffle the options to randomize the order
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

	// Track detailed results for each card
	var cardResults []models.CardResult

	// Validate each answer
	for cardID, userAnswer := range submission.Answers {
		// Convert string ID to UUID
		vocabID, err := uuid.Parse(cardID)
		if err != nil {
			continue
		}

		// Get the vocabulary item to check the correct answer
		vocab, err := h.vocabRepo.GetByID(vocabID)
		if err == nil && vocab != nil {
			isCorrect := vocab.English == userAnswer
			if isCorrect {
				correct++
			}

			// Store card result for detailed feedback
			cardResults = append(cardResults, models.CardResult{
				CardID:        vocabID,
				UserAnswer:    userAnswer,
				CorrectAnswer: vocab.English,
				IsCorrect:     isCorrect,
			})
		}
	}

	// Calculate score
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
