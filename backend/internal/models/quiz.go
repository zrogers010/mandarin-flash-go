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
	Answers   map[string]string `json:"answers" binding:"required"`
	Completed bool              `json:"completed"`
}

// QuizResult represents the result of a quiz
type QuizResult struct {
	QuizID      uuid.UUID `json:"quiz_id"`
	Total       int       `json:"total"`
	Correct     int       `json:"correct"`
	Score       float64   `json:"score"`
	Percentage  float64   `json:"percentage"`
	CompletedAt time.Time `json:"completed_at"`
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
