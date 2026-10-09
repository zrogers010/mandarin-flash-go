package api

import (
	"chinese-learning/internal/models"
	"database/sql"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// GuestHandler handles guest mode and progress merging
type GuestHandler struct {
	db *sql.DB
}

// NewGuestHandler creates a new guest handler
func NewGuestHandler(db *sql.DB) *GuestHandler {
	return &GuestHandler{db: db}
}

// MergeGuestProgress merges localStorage guest progress into authenticated user's account
// POST /api/v1/auth/merge-guest-progress
func (h *GuestHandler) MergeGuestProgress(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.MergeGuestProgressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	guestData := req.GuestData

	// If no guest data, return success (nothing to merge)
	if len(guestData.SeenWords) == 0 && len(guestData.QuizResults) == 0 {
		c.JSON(http.StatusOK, gin.H{
			"message":        "No guest progress to merge",
			"words_added":    0,
			"quizzes_merged": 0,
		})
		return
	}

	log.Printf("[MergeGuestProgress] User %v merging %d seen words, %d quiz results",
		userID, len(guestData.SeenWords), len(guestData.QuizResults))

	// Track merge statistics
	wordsAdded := 0
	wordsSkipped := 0
	quizzesMerged := 0

	// Start a transaction for atomic merge
	tx, err := h.db.Begin()
	if err != nil {
		log.Printf("[MergeGuestProgress] Failed to start transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to merge guest progress"})
		return
	}
	defer tx.Rollback()

	// Filter and validate vocabulary IDs upfront
	validWordIDs := []uuid.UUID{}
	for _, wordIDStr := range guestData.SeenWords {
		wordID, err := uuid.Parse(wordIDStr)
		if err != nil {
			log.Printf("[MergeGuestProgress] Invalid word ID: %s", wordIDStr)
			wordsSkipped++
			continue
		}

		// Check if vocabulary exists in database
		var exists bool
		err = tx.QueryRow(`
			SELECT EXISTS(SELECT 1 FROM vocabulary WHERE id = $1)
		`, wordID).Scan(&exists)

		if err != nil {
			log.Printf("[MergeGuestProgress] Error checking vocabulary existence: %v", err)
			wordsSkipped++
			continue
		}

		if !exists {
			log.Printf("[MergeGuestProgress] Vocabulary ID does not exist: %s", wordIDStr)
			wordsSkipped++
			continue
		}

		validWordIDs = append(validWordIDs, wordID)
	}

	// Merge seen words into user_vocabulary_progress
	// Only add words that the user hasn't already seen
	for _, wordID := range validWordIDs {
		// Check if user already has progress for this word
		var existingCount int
		err := tx.QueryRow(`
			SELECT COUNT(*) FROM user_vocabulary_progress
			WHERE user_id = $1 AND vocabulary_id = $2
		`, userID, wordID).Scan(&existingCount)

		if err != nil {
			log.Printf("[MergeGuestProgress] Error checking existing progress: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to merge guest progress"})
			return
		}

		if existingCount > 0 {
			// User already has this word, skip
			continue
		}

		// Insert initial progress for this word
		_, err = tx.Exec(`
			INSERT INTO user_vocabulary_progress (
				user_id, vocabulary_id, ease_factor, interval_days, repetitions, 
				next_review_at, times_seen, times_correct
			)
			VALUES ($1, $2, 2.5, 0, 0, NOW(), 0, 0)
			ON CONFLICT (user_id, vocabulary_id) DO NOTHING
		`, userID, wordID)

		if err != nil {
			log.Printf("[MergeGuestProgress] Error inserting word progress: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to merge guest progress"})
			return
		}

		wordsAdded++
	}

	// Merge quiz results
	// Count quiz results as cards reviewed for daily activity tracking
	quizzesMerged = len(guestData.QuizResults)

	// Update daily activity with both new words and quiz cards
	// The daily_activity trigger will automatically update last_study_date
	_, err = tx.Exec(`
		INSERT INTO daily_activity (
			id, user_id, activity_date, minutes_studied, cards_reviewed, new_words_learned, goal_met, created_at, updated_at
		)
		VALUES ($1, $2, CURRENT_DATE, 0, $3, $4, false, NOW(), NOW())
		ON CONFLICT (user_id, activity_date) 
		DO UPDATE SET 
			cards_reviewed = daily_activity.cards_reviewed + $3,
			new_words_learned = daily_activity.new_words_learned + $4,
			updated_at = NOW()
	`, uuid.New(), userID, quizzesMerged, wordsAdded)

	if err != nil {
		log.Printf("[MergeGuestProgress] Error updating daily_activity: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to merge guest progress"})
		return
	}

	// Commit the transaction
	if err := tx.Commit(); err != nil {
		log.Printf("[MergeGuestProgress] Failed to commit transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to merge guest progress"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "Guest progress merged successfully",
		"words_added":    wordsAdded,
		"words_skipped":  wordsSkipped,
		"quizzes_merged": quizzesMerged,
	})
}
