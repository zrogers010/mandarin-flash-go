package models

// GuestQuizResult represents a quiz taken before signup
type GuestQuizResult struct {
	QuizType  string            `json:"quiz_type"`
	HSKLevel  *int              `json:"hsk_level,omitempty"`
	Total     int               `json:"total"`
	Correct   int               `json:"correct"`
	Answers   map[string]string `json:"answers"`
	Timestamp string            `json:"timestamp"`
}

// GuestProgress represents progress data from localStorage
type GuestProgress struct {
	CompletedQuizzes []string          `json:"completed_quizzes"`
	SeenWords        []string          `json:"seen_words"`
	QuizResults      []GuestQuizResult `json:"quiz_results"`
	CreatedAt        string            `json:"created_at"`
}

// MergeGuestProgressRequest is the request body for merging guest progress
type MergeGuestProgressRequest struct {
	GuestData GuestProgress `json:"guest_data"`
}
