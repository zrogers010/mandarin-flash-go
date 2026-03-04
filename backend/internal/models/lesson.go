package models

import (
	"time"
)

type Lesson struct {
	ID          int       `json:"id" db:"id"`
	Slug        string    `json:"slug" db:"slug"`
	Title       string    `json:"title" db:"title"`
	Description *string   `json:"description,omitempty" db:"description"`
	Category    string    `json:"category" db:"category"`
	Difficulty  *string   `json:"difficulty,omitempty" db:"difficulty"`
	Content     *string   `json:"content,omitempty" db:"content"`
	SortOrder   int       `json:"sort_order" db:"sort_order"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

type LessonWithVocabulary struct {
	Lesson
	Vocabulary []Vocabulary `json:"vocabulary"`
}
