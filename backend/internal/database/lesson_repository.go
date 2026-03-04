package database

import (
	"database/sql"
	"fmt"

	"chinese-learning/internal/models"
)

type LessonRepository struct {
	db *sql.DB
}

func NewLessonRepository(db *sql.DB) *LessonRepository {
	return &LessonRepository{db: db}
}

func (r *LessonRepository) GetAll(category, difficulty string) ([]models.Lesson, error) {
	query := `SELECT id, slug, title, description, category, difficulty, sort_order, created_at, updated_at
		FROM lessons WHERE 1=1`
	args := []interface{}{}
	argIdx := 1

	if category != "" {
		query += fmt.Sprintf(" AND category = $%d", argIdx)
		args = append(args, category)
		argIdx++
	}
	if difficulty != "" {
		query += fmt.Sprintf(" AND difficulty = $%d", argIdx)
		args = append(args, difficulty)
		argIdx++
	}

	query += " ORDER BY sort_order ASC, created_at ASC"

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("error querying lessons: %w", err)
	}
	defer rows.Close()

	var lessons []models.Lesson
	for rows.Next() {
		var l models.Lesson
		if err := rows.Scan(&l.ID, &l.Slug, &l.Title, &l.Description, &l.Category,
			&l.Difficulty, &l.SortOrder, &l.CreatedAt, &l.UpdatedAt); err != nil {
			return nil, fmt.Errorf("error scanning lesson: %w", err)
		}
		lessons = append(lessons, l)
	}

	return lessons, nil
}

func (r *LessonRepository) GetBySlug(slug string) (*models.LessonWithVocabulary, error) {
	var l models.Lesson
	err := r.db.QueryRow(
		`SELECT id, slug, title, description, category, difficulty, content, sort_order, created_at, updated_at
		FROM lessons WHERE slug = $1`, slug,
	).Scan(&l.ID, &l.Slug, &l.Title, &l.Description, &l.Category,
		&l.Difficulty, &l.Content, &l.SortOrder, &l.CreatedAt, &l.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("error getting lesson by slug: %w", err)
	}

	vocabQuery := fmt.Sprintf(`
		SELECT %s
		FROM vocabulary v
		INNER JOIN lesson_vocabulary lv ON lv.vocabulary_id = v.id
		WHERE lv.lesson_id = $1
		ORDER BY lv.sort_order ASC, v.pinyin ASC
	`, models.VocabColumns)

	rows, err := r.db.Query(vocabQuery, l.ID)
	if err != nil {
		return nil, fmt.Errorf("error querying lesson vocabulary: %w", err)
	}
	defer rows.Close()

	var vocabulary []models.Vocabulary
	for rows.Next() {
		var v models.Vocabulary
		if err := rows.Scan(
			&v.ID, &v.Chinese, &v.Traditional, &v.Pinyin, &v.PinyinNoTones,
			&v.English, &v.PartOfSpeech, &v.HSKLevel, &v.ExampleSentences,
			&v.CreatedAt, &v.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("error scanning lesson vocabulary: %w", err)
		}
		vocabulary = append(vocabulary, v)
	}

	return &models.LessonWithVocabulary{
		Lesson:     l,
		Vocabulary: vocabulary,
	}, nil
}

func (r *LessonRepository) GetCategories() ([]string, error) {
	rows, err := r.db.Query(`SELECT DISTINCT category FROM lessons ORDER BY category`)
	if err != nil {
		return nil, fmt.Errorf("error querying lesson categories: %w", err)
	}
	defer rows.Close()

	var categories []string
	for rows.Next() {
		var c string
		if err := rows.Scan(&c); err != nil {
			return nil, fmt.Errorf("error scanning category: %w", err)
		}
		categories = append(categories, c)
	}

	return categories, nil
}

func (r *LessonRepository) GetVocabularyIDsByLessonID(lessonID int) ([]string, error) {
	rows, err := r.db.Query(
		`SELECT vocabulary_id FROM lesson_vocabulary WHERE lesson_id = $1 ORDER BY sort_order ASC`,
		lessonID,
	)
	if err != nil {
		return nil, fmt.Errorf("error querying lesson vocab IDs: %w", err)
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("error scanning vocab ID: %w", err)
		}
		ids = append(ids, id)
	}

	return ids, nil
}

func (r *LessonRepository) GetByID(id int) (*models.Lesson, error) {
	var l models.Lesson
	err := r.db.QueryRow(
		`SELECT id, slug, title, description, category, difficulty, content, sort_order, created_at, updated_at
		FROM lessons WHERE id = $1`, id,
	).Scan(&l.ID, &l.Slug, &l.Title, &l.Description, &l.Category,
		&l.Difficulty, &l.Content, &l.SortOrder, &l.CreatedAt, &l.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("error getting lesson by ID: %w", err)
	}

	return &l, nil
}

func (r *LessonRepository) GetBySlugSimple(slug string) (*models.Lesson, error) {
	var l models.Lesson
	err := r.db.QueryRow(
		`SELECT id, slug, title, description, category, difficulty, content, sort_order, created_at, updated_at
		FROM lessons WHERE slug = $1`, slug,
	).Scan(&l.ID, &l.Slug, &l.Title, &l.Description, &l.Category,
		&l.Difficulty, &l.Content, &l.SortOrder, &l.CreatedAt, &l.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("error getting lesson by slug: %w", err)
	}

	return &l, nil
}
