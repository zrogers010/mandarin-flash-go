package api

import (
	"chinese-learning/internal/models"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// MergeGuestProgress merges localStorage guest progress into authenticated user's account
// POST /api/v1/auth/merge-guest-progress
func (s *Server) MergeGuestProgress(c *gin.Context) {
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
	quizzesMerged := 0

	// Merge seen words into user_vocabulary_progress
	// Only add words that the user hasn't already seen
	for _, wordID := range guestData.SeenWords {
		// Validate wordID is a valid UUID
		if _, err := uuid.Parse(wordID); err != nil {
			log.Printf("[MergeGuestProgress] Invalid word ID: %s", wordID)
			continue
		}

		// Check if user already has progress for this word
		var existingCount int
		err := s.DB.QueryRow(`
			SELECT COUNT(*) FROM user_vocabulary_progress
			WHERE user_id = $1 AND vocabulary_id = $2
		`, userID, wordID).Scan(&existingCount)

		if err != nil {
			log.Printf("[MergeGuestProgress] Error checking existing progress: %v", err)
			continue
		}

		if existingCount > 0 {
			// User already has this word, skip
			continue
		}

		// Insert initial progress for this word
		_, err = s.DB.Exec(`
			INSERT INTO user_vocabulary_progress (
				id, user_id, vocabulary_id, 
				level, interval_days, due_date, 
				times_reviewed, times_correct, times_incorrect,
				created_at, updated_at
			)
			VALUES ($1, $2, $3, 0, 1, NOW(), 0, 0, 0, NOW(), NOW())
			ON CONFLICT (user_id, vocabulary_id) DO NOTHING
		`, uuid.New(), userID, wordID)

		if err != nil {
			log.Printf("[MergeGuestProgress] Error inserting word progress: %v", err)
			continue
		}

		wordsAdded++
	}

	// Merge quiz results
	// We don't have a quiz_history table yet, so for now just count them
	// In the future, we could insert these into a quiz_history table
	quizzesMerged = len(guestData.QuizResults)

	// Log the merge for analytics
	_, _ = s.DB.Exec(`
		INSERT INTO daily_activity (
			id, user_id, date, minutes_studied, cards_reviewed, new_words_learned, created_at, updated_at
		)
		VALUES ($1, $2, CURRENT_DATE, 0, 0, $3, NOW(), NOW())
		ON CONFLICT (user_id, date) 
		DO UPDATE SET 
			new_words_learned = daily_activity.new_words_learned + $3,
			updated_at = NOW()
	`, uuid.New(), userID, wordsAdded)

	c.JSON(http.StatusOK, gin.H{
		"message":        "Guest progress merged successfully",
		"words_added":    wordsAdded,
		"quizzes_merged": quizzesMerged,
	})
}
