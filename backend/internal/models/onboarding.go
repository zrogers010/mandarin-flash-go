package models

import (
	"time"

	"github.com/google/uuid"
)

// OnboardingRequest represents the onboarding questionnaire data
type OnboardingRequest struct {
	LearningGoal      string `json:"learning_goal" binding:"required"`      // beginner, intermediate, advanced, hsk_exam, travel, business
	CurrentHSKLevel   *int   `json:"current_hsk_level"`                     // 0-6, where 0 = complete beginner
	TargetHSKLevel    *int   `json:"target_hsk_level"`                      // 1-6
	DailyMinutesGoal  int    `json:"daily_minutes_goal" binding:"required"` // 5, 10, 15, 20, 30, 60
	Timezone          string `json:"timezone"`                              // IANA timezone, e.g. "America/Los_Angeles"
}

// DailyActivity tracks daily study metrics for streak calculation
type DailyActivity struct {
	ID               uuid.UUID `json:"id" db:"id"`
	UserID           uuid.UUID `json:"user_id" db:"user_id"`
	ActivityDate     time.Time `json:"activity_date" db:"activity_date"`
	MinutesStudied   int       `json:"minutes_studied" db:"minutes_studied"`
	CardsReviewed    int       `json:"cards_reviewed" db:"cards_reviewed"`
	NewWordsLearned  int       `json:"new_words_learned" db:"new_words_learned"`
	QuizzesCompleted int       `json:"quizzes_completed" db:"quizzes_completed"`
	GoalMet          bool      `json:"goal_met" db:"goal_met"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}

// DailyStats represents today's progress toward goals
type DailyStats struct {
	TodayMinutes      int       `json:"today_minutes"`
	TodayCardsReviewed int      `json:"today_cards_reviewed"`
	TodayNewWords     int       `json:"today_new_words"`
	TodayGoalMet      bool      `json:"today_goal_met"`
	DailyGoal         int       `json:"daily_goal"`
	StreakDays        int       `json:"streak_days"`
	LastStudyDate     *time.Time `json:"last_study_date,omitempty"`
	ReviewsDue        int       `json:"reviews_due"`
}

// GuestProgress represents locally stored progress before signup
type GuestProgress struct {
	CompletedQuizzes []string          `json:"completed_quizzes"` // Quiz IDs
	SeenWords        []string          `json:"seen_words"`        // Vocabulary IDs
	QuizResults      []GuestQuizResult `json:"quiz_results"`
}

// GuestQuizResult stores a guest quiz result for later merge
type GuestQuizResult struct {
	QuizType  string            `json:"quiz_type"`
	HSKLevel  int               `json:"hsk_level"`
	Total     int               `json:"total"`
	Correct   int               `json:"correct"`
	Answers   map[string]string `json:"answers"`
	Timestamp time.Time         `json:"timestamp"`
}
