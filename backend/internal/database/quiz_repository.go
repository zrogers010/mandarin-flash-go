package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"chinese-learning/internal/models"

	"github.com/google/uuid"
)

// QuizRepositoryImpl implements quiz result persistence
type QuizRepositoryImpl struct {
	db *sql.DB
}

// NewQuizRepository creates a new quiz repository
func NewQuizRepository(db *sql.DB) *QuizRepositoryImpl {
	return &QuizRepositoryImpl{db: db}
}

// SaveQuizResult persists a quiz result for an authenticated user
func (r *QuizRepositoryImpl) SaveQuizResult(result *models.QuizResultRecord) error {
	cardResultsJSON, err := json.Marshal(result.CardResults)
	if err != nil {
		return fmt.Errorf("failed to marshal card results: %w", err)
	}

	query := `
		INSERT INTO quiz_results (id, user_id, quiz_type, hsk_level, total, correct, score, percentage, card_results, created_at, completed_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`

	_, err = r.db.Exec(query,
		result.ID,
		result.UserID,
		result.QuizType,
		result.HSKLevel,
		result.Total,
		result.Correct,
		result.Score,
		result.Percentage,
		cardResultsJSON,
		result.CreatedAt,
		result.CompletedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to save quiz result: %w", err)
	}

	return nil
}

// GetQuizHistory retrieves quiz history for a user with pagination
func (r *QuizRepositoryImpl) GetQuizHistory(userID uuid.UUID, limit, offset int) ([]models.QuizHistory, int, error) {
	// Get total count
	var total int
	countQuery := `SELECT COUNT(*) FROM quiz_results WHERE user_id = $1`
	if err := r.db.QueryRow(countQuery, userID).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count quiz results: %w", err)
	}

	if limit <= 0 {
		limit = 20
	}

	query := `
		SELECT id, quiz_type, hsk_level, total, correct, score, percentage, created_at, completed_at
		FROM quiz_results
		WHERE user_id = $1
		ORDER BY completed_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(query, userID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get quiz history: %w", err)
	}
	defer rows.Close()

	var history []models.QuizHistory
	for rows.Next() {
		var h models.QuizHistory
		var hskLevel sql.NullInt32

		err := rows.Scan(
			&h.ID,
			&h.Type,
			&hskLevel,
			&h.Total,
			&h.Correct,
			&h.Score,
			&h.Percentage,
			&h.CreatedAt,
			&h.CompletedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan quiz history row: %w", err)
		}

		if hskLevel.Valid {
			level := int(hskLevel.Int32)
			h.HSKLevel = &level
		}

		history = append(history, h)
	}

	return history, total, nil
}

// GetQuizStats returns summary statistics for a user
func (r *QuizRepositoryImpl) GetQuizStats(userID uuid.UUID) (*models.QuizStats, error) {
	query := `
		SELECT
			COUNT(*) as total_quizzes,
			COALESCE(SUM(total), 0) as total_questions,
			COALESCE(SUM(correct), 0) as total_correct,
			COALESCE(AVG(percentage), 0) as avg_score,
			COALESCE(MAX(percentage), 0) as best_score
		FROM quiz_results
		WHERE user_id = $1
	`

	stats := &models.QuizStats{}
	err := r.db.QueryRow(query, userID).Scan(
		&stats.TotalQuizzes,
		&stats.TotalQuestions,
		&stats.TotalCorrect,
		&stats.AverageScore,
		&stats.BestScore,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get quiz stats: %w", err)
	}

	// Get recent activity (last 7 days)
	recentQuery := `
		SELECT COUNT(*) FROM quiz_results
		WHERE user_id = $1 AND completed_at >= NOW() - INTERVAL '7 days'
	`
	err = r.db.QueryRow(recentQuery, userID).Scan(&stats.QuizzesThisWeek)
	if err != nil {
		return nil, fmt.Errorf("failed to get recent quiz count: %w", err)
	}

	// Get streak info
	streakQuery := `
		SELECT DISTINCT DATE(completed_at) as quiz_date
		FROM quiz_results
		WHERE user_id = $1
		ORDER BY quiz_date DESC
		LIMIT 30
	`
	rows, err := r.db.Query(streakQuery, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get streak data: %w", err)
	}
	defer rows.Close()

	var dates []time.Time
	for rows.Next() {
		var d time.Time
		if err := rows.Scan(&d); err == nil {
			dates = append(dates, d)
		}
	}

	stats.CurrentStreak = calculateStreak(dates)

	return stats, nil
}

// calculateStreak counts consecutive days with activity ending at today
func calculateStreak(dates []time.Time) int {
	if len(dates) == 0 {
		return 0
	}

	today := time.Now().Truncate(24 * time.Hour)
	streak := 0

	for i, d := range dates {
		expected := today.AddDate(0, 0, -i)
		if d.Truncate(24 * time.Hour).Equal(expected) {
			streak++
		} else {
			break
		}
	}

	return streak
}
