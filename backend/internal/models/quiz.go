package models

import (
	"time"

	"github.com/google/uuid"
)

// QuizType represents the type of quiz
type QuizType string

const (
	QuizTypePractice QuizType = "practice"
	QuizTypeScored   QuizType = "scored"
)

// QuizCard represents a single flashcard in a quiz
type QuizCard struct {
	ID               uuid.UUID         `json:"id"`
	Chinese          string            `json:"chinese"`
	Pinyin           string            `json:"pinyin"`
	English          string            `json:"english"`
	HSKLevel         int               `json:"hsk_level"`
	ExampleSentences []ExampleSentence `json:"example_sentences"`
	UserAnswer       string            `json:"user_answer,omitempty"`
	IsCorrect        *bool             `json:"is_correct,omitempty"`
	ShowPinyin       bool              `json:"show_pinyin"`
	ShowAnswer       bool              `json:"show_answer"`
	MultipleChoice   []string          `json:"multiple_choice,omitempty"`
	CorrectAnswer    string            `json:"correct_answer,omitempty"`
}

// Quiz represents a complete quiz session
type Quiz struct {
	ID          uuid.UUID  `json:"id"`
	Type        QuizType   `json:"type"`
	Cards       []QuizCard `json:"cards"`
	Total       int        `json:"total"`
	Correct     int        `json:"correct,omitempty"`
	Score       float64    `json:"score,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
}

// QuizRequest represents a request to generate a quiz
type QuizRequest struct {
	Type     QuizType `json:"type" binding:"required,oneof=practice scored"`
	HSKLevel *int     `json:"hsk_level,omitempty"`
	Count    int      `json:"count,omitempty"`
}

// QuizSubmission represents a quiz submission
type QuizSubmission struct {
	QuizID    uuid.UUID         `json:"quiz_id" binding:"required"`
	QuizType  QuizType          `json:"quiz_type"`
	HSKLevel  *int              `json:"hsk_level,omitempty"`
	Answers   map[string]string `json:"answers" binding:"required"`
	Completed bool              `json:"completed"`
}

// QuizResult represents the result of a quiz
type QuizResult struct {
	QuizID      uuid.UUID    `json:"quiz_id"`
	Total       int          `json:"total"`
	Correct     int          `json:"correct"`
	Score       float64      `json:"score"`
	Percentage  float64      `json:"percentage"`
	CardResults []CardResult `json:"card_results,omitempty"`
	CompletedAt time.Time    `json:"completed_at"`
}

// CardResult represents the result of a single card in a quiz
type CardResult struct {
	CardID        uuid.UUID `json:"card_id"`
	UserAnswer    string    `json:"user_answer"`
	CorrectAnswer string    `json:"correct_answer"`
	IsCorrect     bool      `json:"is_correct"`
}

// QuizHistory represents a quiz history entry
type QuizHistory struct {
	ID          uuid.UUID `json:"id"`
	Type        QuizType  `json:"type"`
	Total       int       `json:"total"`
	Correct     int       `json:"correct"`
	Score       float64   `json:"score"`
	Percentage  float64   `json:"percentage"`
	HSKLevel    *int      `json:"hsk_level,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	CompletedAt time.Time `json:"completed_at"`
}

// QuizResultRecord is the database-level representation of a persisted quiz result
type QuizResultRecord struct {
	ID          uuid.UUID    `json:"id"`
	UserID      uuid.UUID    `json:"user_id"`
	QuizType    QuizType     `json:"quiz_type"`
	HSKLevel    *int         `json:"hsk_level,omitempty"`
	Total       int          `json:"total"`
	Correct     int          `json:"correct"`
	Score       float64      `json:"score"`
	Percentage  float64      `json:"percentage"`
	CardResults []CardResult `json:"card_results,omitempty"`
	CreatedAt   time.Time    `json:"created_at"`
	CompletedAt time.Time    `json:"completed_at"`
}

// QuizStats represents aggregate quiz statistics for a user
type QuizStats struct {
	TotalQuizzes   int     `json:"total_quizzes"`
	TotalQuestions int     `json:"total_questions"`
	TotalCorrect   int     `json:"total_correct"`
	AverageScore   float64 `json:"average_score"`
	BestScore      float64 `json:"best_score"`
	CurrentStreak  int     `json:"current_streak"`
	QuizzesThisWeek int    `json:"quizzes_this_week"`
}
