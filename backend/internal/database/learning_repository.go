package database

import (
	"database/sql"
	"fmt"
	"math"
	"time"

	"chinese-learning/internal/models"

	"github.com/google/uuid"
)

// LearningRepository handles spaced repetition and learning progress operations
type LearningRepository struct {
	db *sql.DB
}

// NewLearningRepository creates a new learning repository
func NewLearningRepository(db *sql.DB) *LearningRepository {
	return &LearningRepository{db: db}
}

// ═══════════════════════════════════════════════════════════════════
// SM-2 Algorithm Implementation
// ═══════════════════════════════════════════════════════════════════

// SM2Result holds the output of a single SM-2 calculation
type SM2Result struct {
	EaseFactor   float64
	IntervalDays int
	Repetitions  int
	NextReview   time.Time
}

// CalculateSM2 implements the SuperMemo SM-2 spaced repetition algorithm
//
// quality: user's response quality (0-5)
//   0 = complete blackout
//   1 = incorrect but remembered after seeing answer
//   2 = incorrect but seemed easy to recall
//   3 = correct with serious difficulty
//   4 = correct after hesitation
//   5 = perfect instant recall
func CalculateSM2(currentEF float64, currentInterval int, currentReps int, quality int) SM2Result {
	// Clamp quality to valid range
	if quality < 0 {
		quality = 0
	}
	if quality > 5 {
		quality = 5
	}

	var newEF float64
	var newInterval int
	var newReps int

	if quality >= 3 {
		// Correct response
		switch currentReps {
		case 0:
			newInterval = 1
		case 1:
			newInterval = 6
		default:
			newInterval = int(math.Round(float64(currentInterval) * currentEF))
		}
		newReps = currentReps + 1
	} else {
		// Incorrect response — restart repetitions
		newInterval = 1
		newReps = 0
	}

	// Calculate new ease factor
	// EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
	newEF = currentEF + (0.1 - float64(5-quality)*(0.08+float64(5-quality)*0.02))

	// EF must not go below 1.3
	if newEF < 1.3 {
		newEF = 1.3
	}

	// Interval must be at least 1 day
	if newInterval < 1 {
		newInterval = 1
	}

	return SM2Result{
		EaseFactor:   math.Round(newEF*100) / 100,
		IntervalDays: newInterval,
		Repetitions:  newReps,
		NextReview:   time.Now().AddDate(0, 0, newInterval),
	}
}

// ═══════════════════════════════════════════════════════════════════
// Repository Operations
// ═══════════════════════════════════════════════════════════════════

// GetDueReviewItems returns vocabulary items due for review for a user
func (r *LearningRepository) GetDueReviewItems(userID uuid.UUID, hskLevel *int, limit int) ([]models.ReviewItem, error) {
	if limit <= 0 || limit > 50 {
		limit = 20
	}

	query := `
		SELECT v.id, v.chinese, v.pinyin, v.pinyin_no_tones, v.english, v.part_of_speech, v.hsk_level, v.example_sentences, v.created_at, v.updated_at,
			p.id as p_id, p.ease_factor, p.interval_days, p.repetitions, p.next_review_at, p.times_seen, p.times_correct, p.last_quality, p.last_reviewed_at, p.created_at as p_created_at, p.updated_at as p_updated_at
		FROM user_vocabulary_progress p
		JOIN vocabulary v ON p.vocabulary_id = v.id
		WHERE p.user_id = $1 AND p.next_review_at <= NOW()
	`
	args := []interface{}{userID}
	argIdx := 2

	if hskLevel != nil {
		query += fmt.Sprintf(" AND v.hsk_level = $%d", argIdx)
		args = append(args, *hskLevel)
		argIdx++
	}

	query += fmt.Sprintf(" ORDER BY p.next_review_at ASC LIMIT $%d", argIdx)
	args = append(args, limit)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get due review items: %w", err)
	}
	defer rows.Close()

	var items []models.ReviewItem
	for rows.Next() {
		var item models.ReviewItem
		var prog models.UserVocabularyProgress

		err := rows.Scan(
			&item.ID, &item.Chinese, &item.Pinyin, &item.PinyinNoTones,
			&item.English, &item.PartOfSpeech, &item.HSKLevel,
			&item.ExampleSentences, &item.CreatedAt, &item.UpdatedAt,
			&prog.ID, &prog.EaseFactor, &prog.IntervalDays, &prog.Repetitions,
			&prog.NextReviewAt, &prog.TimesSeen, &prog.TimesCorrect,
			&prog.LastQuality, &prog.LastReviewedAt, &prog.CreatedAt, &prog.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan review item: %w", err)
		}

		prog.UserID = userID
		prog.VocabularyID = item.ID
		item.Progress = &prog
		items = append(items, item)
	}

	return items, nil
}

// GetNewWordsForStudy returns vocabulary items the user hasn't studied yet
func (r *LearningRepository) GetNewWordsForStudy(userID uuid.UUID, hskLevel *int, limit int) ([]models.ReviewItem, error) {
	if limit <= 0 || limit > 50 {
		limit = 10
	}

	query := `
		SELECT v.id, v.chinese, v.pinyin, v.pinyin_no_tones, v.english, v.part_of_speech, v.hsk_level, v.example_sentences, v.created_at, v.updated_at
		FROM vocabulary v
		WHERE NOT EXISTS (
			SELECT 1 FROM user_vocabulary_progress p
			WHERE p.vocabulary_id = v.id AND p.user_id = $1
		)
	`
	args := []interface{}{userID}
	argIdx := 2

	if hskLevel != nil {
		query += fmt.Sprintf(" AND v.hsk_level = $%d", argIdx)
		args = append(args, *hskLevel)
		argIdx++
	}

	query += fmt.Sprintf(" ORDER BY v.hsk_level ASC, RANDOM() LIMIT $%d", argIdx)
	args = append(args, limit)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get new words: %w", err)
	}
	defer rows.Close()

	var items []models.ReviewItem
	for rows.Next() {
		var item models.ReviewItem
		err := rows.Scan(
			&item.ID, &item.Chinese, &item.Pinyin, &item.PinyinNoTones,
			&item.English, &item.PartOfSpeech, &item.HSKLevel,
			&item.ExampleSentences, &item.CreatedAt, &item.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan new word: %w", err)
		}
		items = append(items, item)
	}

	return items, nil
}

// SubmitReview processes a single review and updates the spaced repetition schedule
func (r *LearningRepository) SubmitReview(userID, vocabularyID uuid.UUID, quality int) (*models.UserVocabularyProgress, error) {
	// Upsert: try to get existing progress, or create new
	var prog models.UserVocabularyProgress
	var exists bool

	getQuery := `
		SELECT id, ease_factor, interval_days, repetitions, next_review_at, times_seen, times_correct
		FROM user_vocabulary_progress
		WHERE user_id = $1 AND vocabulary_id = $2
	`
	err := r.db.QueryRow(getQuery, userID, vocabularyID).Scan(
		&prog.ID, &prog.EaseFactor, &prog.IntervalDays, &prog.Repetitions,
		&prog.NextReviewAt, &prog.TimesSeen, &prog.TimesCorrect,
	)
	if err == nil {
		exists = true
	} else if err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to get progress: %w", err)
	}

	// Calculate new SM-2 values
	ef := 2.5
	interval := 0
	reps := 0
	if exists {
		ef = prog.EaseFactor
		interval = prog.IntervalDays
		reps = prog.Repetitions
	}

	result := CalculateSM2(ef, interval, reps, quality)

	// Update counters
	timesSeen := 1
	timesCorrect := 0
	if exists {
		timesSeen = prog.TimesSeen + 1
		timesCorrect = prog.TimesCorrect
	}
	if quality >= 3 {
		timesCorrect++
	}

	now := time.Now()

	if exists {
		updateQuery := `
			UPDATE user_vocabulary_progress
			SET ease_factor = $1, interval_days = $2, repetitions = $3, next_review_at = $4,
				times_seen = $5, times_correct = $6, last_quality = $7, last_reviewed_at = $8
			WHERE user_id = $9 AND vocabulary_id = $10
			RETURNING id, ease_factor, interval_days, repetitions, next_review_at, times_seen, times_correct, last_quality, last_reviewed_at, created_at, updated_at
		`
		err = r.db.QueryRow(updateQuery,
			result.EaseFactor, result.IntervalDays, result.Repetitions, result.NextReview,
			timesSeen, timesCorrect, quality, now,
			userID, vocabularyID,
		).Scan(
			&prog.ID, &prog.EaseFactor, &prog.IntervalDays, &prog.Repetitions,
			&prog.NextReviewAt, &prog.TimesSeen, &prog.TimesCorrect,
			&prog.LastQuality, &prog.LastReviewedAt, &prog.CreatedAt, &prog.UpdatedAt,
		)
	} else {
		insertQuery := `
			INSERT INTO user_vocabulary_progress (user_id, vocabulary_id, ease_factor, interval_days, repetitions, next_review_at, times_seen, times_correct, last_quality, last_reviewed_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			RETURNING id, ease_factor, interval_days, repetitions, next_review_at, times_seen, times_correct, last_quality, last_reviewed_at, created_at, updated_at
		`
		err = r.db.QueryRow(insertQuery,
			userID, vocabularyID, result.EaseFactor, result.IntervalDays, result.Repetitions, result.NextReview,
			timesSeen, timesCorrect, quality, now,
		).Scan(
			&prog.ID, &prog.EaseFactor, &prog.IntervalDays, &prog.Repetitions,
			&prog.NextReviewAt, &prog.TimesSeen, &prog.TimesCorrect,
			&prog.LastQuality, &prog.LastReviewedAt, &prog.CreatedAt, &prog.UpdatedAt,
		)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to save progress: %w", err)
	}

	prog.UserID = userID
	prog.VocabularyID = vocabularyID

	return &prog, nil
}

// GetLearningStats returns aggregate learning statistics for a user
func (r *LearningRepository) GetLearningStats(userID uuid.UUID) (*models.LearningStats, error) {
	stats := &models.LearningStats{
		WordsByLevel: make(map[int]models.LevelStats),
	}

	// Aggregate stats
	aggQuery := `
		SELECT
			COUNT(*) as total_learned,
			COUNT(*) FILTER (WHERE repetitions >= 5) as mastered,
			COUNT(*) FILTER (WHERE next_review_at <= NOW()) as due,
			COALESCE(AVG(ease_factor), 2.5) as avg_ef,
			COALESCE(SUM(times_seen), 0) as total_reviews,
			COALESCE(SUM(times_correct), 0) as total_correct
		FROM user_vocabulary_progress
		WHERE user_id = $1
	`
	var totalCorrect int
	err := r.db.QueryRow(aggQuery, userID).Scan(
		&stats.TotalWordsLearned,
		&stats.WordsMastered,
		&stats.WordsDueForReview,
		&stats.AverageEaseFactor,
		&stats.TotalReviews,
		&totalCorrect,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get learning stats: %w", err)
	}

	if stats.TotalReviews > 0 {
		stats.AccuracyRate = float64(totalCorrect) / float64(stats.TotalReviews) * 100
	}

	// Per-level stats
	levelQuery := `
		SELECT
			v.hsk_level,
			COUNT(DISTINCT v.id) as total_words,
			COUNT(DISTINCT p.vocabulary_id) as learned,
			COUNT(DISTINCT p.vocabulary_id) FILTER (WHERE p.repetitions >= 5) as mastered,
			COUNT(DISTINCT p.vocabulary_id) FILTER (WHERE p.next_review_at <= NOW()) as due
		FROM vocabulary v
		LEFT JOIN user_vocabulary_progress p ON v.id = p.vocabulary_id AND p.user_id = $1
		GROUP BY v.hsk_level
		ORDER BY v.hsk_level
	`
	rows, err := r.db.Query(levelQuery, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get level stats: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var level int
		var ls models.LevelStats
		if err := rows.Scan(&level, &ls.TotalWords, &ls.WordsLearned, &ls.WordsMastered, &ls.WordsDue); err == nil {
			stats.WordsByLevel[level] = ls
		}
	}

	// Calculate streak from review dates
	streakQuery := `
		SELECT DISTINCT DATE(last_reviewed_at) as review_date
		FROM user_vocabulary_progress
		WHERE user_id = $1 AND last_reviewed_at IS NOT NULL
		ORDER BY review_date DESC
		LIMIT 30
	`
	streakRows, err := r.db.Query(streakQuery, userID)
	if err == nil {
		defer streakRows.Close()
		var dates []time.Time
		for streakRows.Next() {
			var d time.Time
			if err := streakRows.Scan(&d); err == nil {
				dates = append(dates, d)
			}
		}
		stats.CurrentStreak = calculateStreak(dates)
	}

	return stats, nil
}
