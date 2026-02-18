package models

import (
	"time"

	"github.com/google/uuid"
)

// UserVocabularyProgress tracks per-word learning for a user
type UserVocabularyProgress struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	UserID         uuid.UUID  `json:"user_id" db:"user_id"`
	VocabularyID   uuid.UUID  `json:"vocabulary_id" db:"vocabulary_id"`
	EaseFactor     float64    `json:"ease_factor" db:"ease_factor"`
	IntervalDays   int        `json:"interval_days" db:"interval_days"`
	Repetitions    int        `json:"repetitions" db:"repetitions"`
	NextReviewAt   time.Time  `json:"next_review_at" db:"next_review_at"`
	TimesSeen      int        `json:"times_seen" db:"times_seen"`
	TimesCorrect   int        `json:"times_correct" db:"times_correct"`
	LastQuality    *int       `json:"last_quality,omitempty" db:"last_quality"`
	LastReviewedAt *time.Time `json:"last_reviewed_at,omitempty" db:"last_reviewed_at"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
}

// ReviewItem is a vocabulary word that is due for review
type ReviewItem struct {
	Vocabulary
	Progress *UserVocabularyProgress `json:"progress,omitempty"`
}

// ReviewSubmission represents a user's review answer for one word
type ReviewSubmission struct {
	VocabularyID uuid.UUID `json:"vocabulary_id" binding:"required"`
	Quality      int       `json:"quality" binding:"required,min=0,max=5"`
	// Quality ratings (SM-2):
	//  0 - Complete blackout, no recognition
	//  1 - Incorrect, but upon seeing correct answer, remembered
	//  2 - Incorrect, but correct answer seemed easy to recall
	//  3 - Correct with serious difficulty
	//  4 - Correct after hesitation
	//  5 - Perfect, instant recall
}

// ReviewBatchSubmission represents a batch of review results
type ReviewBatchSubmission struct {
	Reviews []ReviewSubmission `json:"reviews" binding:"required"`
}

// LearningStats represents a user's overall learning statistics
type LearningStats struct {
	TotalWordsLearned   int     `json:"total_words_learned"`   // words seen at least once
	WordsMastered       int     `json:"words_mastered"`        // repetitions >= 5
	WordsDueForReview   int     `json:"words_due_for_review"`  // next_review_at <= now
	AverageEaseFactor   float64 `json:"average_ease_factor"`
	CurrentStreak       int     `json:"current_streak"`        // consecutive days with reviews
	TotalReviews        int     `json:"total_reviews"`         // total reviews submitted
	AccuracyRate        float64 `json:"accuracy_rate"`         // times_correct / times_seen
	WordsByLevel        map[int]LevelStats `json:"words_by_level"`
}

// LevelStats represents stats for a single HSK level
type LevelStats struct {
	TotalWords    int `json:"total_words"`
	WordsLearned  int `json:"words_learned"`
	WordsMastered int `json:"words_mastered"`
	WordsDue      int `json:"words_due"`
}
