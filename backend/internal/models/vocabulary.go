package models

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
)

// stripTones removes tone marks from pinyin
func stripTones(pinyin string) string {
	// Replace tone marks with their base vowels
	replacements := map[string]string{
		"ā": "a", "á": "a", "ǎ": "a", "à": "a",
		"ē": "e", "é": "e", "ě": "e", "è": "e",
		"ī": "i", "í": "i", "ǐ": "i", "ì": "i",
		"ō": "o", "ó": "o", "ǒ": "o", "ò": "o",
		"ū": "u", "ú": "u", "ǔ": "u", "ù": "u",
		"ǖ": "ü", "ǘ": "ü", "ǚ": "ü", "ǜ": "ü",
		"Ā": "A", "Á": "A", "Ǎ": "A", "À": "A",
		"Ē": "E", "É": "E", "Ě": "E", "È": "E",
		"Ī": "I", "Í": "I", "Ǐ": "I", "Ì": "I",
		"Ō": "O", "Ó": "O", "Ǒ": "O", "Ò": "O",
		"Ū": "U", "Ú": "U", "Ǔ": "U", "Ù": "U",
		"Ǖ": "Ü", "Ǘ": "Ü", "Ǚ": "Ü", "Ǜ": "Ü",
	}

	result := pinyin
	for tone, base := range replacements {
		result = strings.ReplaceAll(result, tone, base)
	}

	// Also remove tone numbers (1-4) that might be present
	re := regexp.MustCompile(`[1-4]`)
	result = re.ReplaceAllString(result, "")

	return result
}

// ExampleSentence represents a single example sentence with translations
type ExampleSentence struct {
	Chinese string `json:"chinese"`
	Pinyin  string `json:"pinyin"`
	English string `json:"english"`
}

// Vocabulary represents a Chinese vocabulary word
type Vocabulary struct {
	ID               uuid.UUID       `json:"id" db:"id"`
	Chinese          string          `json:"chinese" db:"chinese"`
	Traditional      *string         `json:"traditional,omitempty" db:"traditional"`
	Pinyin           string          `json:"pinyin" db:"pinyin"`
	PinyinNoTones   string          `json:"pinyin_no_tones" db:"pinyin_no_tones"`
	English          string          `json:"english" db:"english"`
	PartOfSpeech     *string         `json:"part_of_speech,omitempty" db:"part_of_speech"`
	HSKLevel         int             `json:"hsk_level" db:"hsk_level"`
	ExampleSentences json.RawMessage `json:"example_sentences" db:"example_sentences"`
	CreatedAt        time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at" db:"updated_at"`
}

// GetExampleSentences parses the example sentences JSON and returns structured data
func (v *Vocabulary) GetExampleSentences() ([]ExampleSentence, error) {
	if v.ExampleSentences == nil {
		return []ExampleSentence{}, nil
	}

	var sentences []ExampleSentence
	err := json.Unmarshal(v.ExampleSentences, &sentences)
	if err != nil {
		// Try to parse as simple string array for backward compatibility
		var simpleSentences []string
		if err2 := json.Unmarshal(v.ExampleSentences, &simpleSentences); err2 != nil {
			return nil, fmt.Errorf("failed to parse example sentences: %w", err)
		}

		// Convert simple strings to structured format
		for _, s := range simpleSentences {
			sentences = append(sentences, ExampleSentence{
				Chinese: s,
				Pinyin:  "",
				English: "",
			})
		}
	}

	return sentences, nil
}

// GeneratePinyinNoTones generates the no-tone pinyin from the regular pinyin
func (v *Vocabulary) GeneratePinyinNoTones() string {
	if v.PinyinNoTones != "" {
		return v.PinyinNoTones
	}
	return stripTones(v.Pinyin)
}

// VocabularyListResponse represents the response for listing vocabulary
type VocabularyListResponse struct {
	Vocabulary []Vocabulary `json:"vocabulary"`
	Total      int          `json:"total"`
	Page       int          `json:"page"`
	Limit      int          `json:"limit"`
}

// VocabularyFilters represents filters for vocabulary queries
type VocabularyFilters struct {
	HSKLevel *int    `json:"hsk_level,omitempty"`
	Search   *string `json:"search,omitempty"`
	Page     int     `json:"page"`
	Limit    int     `json:"limit"`
	SortBy   string  `json:"sort_by,omitempty"`   // Field to sort by: pinyin, chinese, english, hsk_level
	SortOrder string `json:"sort_order,omitempty"` // asc or desc
}

// VocabularyRepository handles database operations for vocabulary
type VocabularyRepository struct {
	db *sql.DB
}

// NewVocabularyRepository creates a new vocabulary repository
func NewVocabularyRepository(db *sql.DB) *VocabularyRepository {
	return &VocabularyRepository{db: db}
}

// GetAll retrieves all vocabulary with optional filters
func (r *VocabularyRepository) GetAll(filters VocabularyFilters) (*VocabularyListResponse, error) {
	query := `
		SELECT id, chinese, traditional, pinyin, pinyin_no_tones, english, part_of_speech, hsk_level, example_sentences, created_at, updated_at
		FROM vocabulary
		WHERE 1=1
	`
	args := []interface{}{}
	argIndex := 1

	if filters.HSKLevel != nil {
		query += fmt.Sprintf(" AND hsk_level = $%d", argIndex)
		args = append(args, *filters.HSKLevel)
		argIndex++
	} else {
		query += " AND hsk_level >= 1"
	}

	if filters.Search != nil && *filters.Search != "" {
		searchTerm := "%" + *filters.Search + "%"
		// Search in Chinese, English, and pinyin
		query += fmt.Sprintf(` AND (
			chinese ILIKE $%d OR 
			english ILIKE $%d OR 
			pinyin ILIKE $%d
		)`, argIndex, argIndex, argIndex)
		args = append(args, searchTerm)
		argIndex++
	}

	// Add sorting before pagination
	if filters.SortBy == "" {
		filters.SortBy = "pinyin" // default sort
	}
	if filters.SortOrder == "" {
		filters.SortOrder = "asc" // default order
	}
	
	// Validate sort field to prevent SQL injection
	validSortFields := map[string]string{
		"pinyin": "pinyin_no_tones", // Use pinyin_no_tones for better alphabetical sorting
		"chinese": "chinese", 
		"english": "english",
		"hsk_level": "hsk_level",
		"created_at": "created_at",
	}
	
	sortField, valid := validSortFields[filters.SortBy]
	if !valid {
		sortField = "pinyin" // fallback to default
	}
	
	// Validate sort order
	if filters.SortOrder != "asc" && filters.SortOrder != "desc" {
		filters.SortOrder = "asc"
	}
	
	// Add sorting
	query += fmt.Sprintf(" ORDER BY %s %s", sortField, filters.SortOrder)
	
	// Get total count
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM (%s) as subquery", query)
	var total int
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("error counting vocabulary: %w", err)
	}

	// Add pagination
	if filters.Limit <= 0 {
		filters.Limit = 20
	}
	if filters.Page <= 0 {
		filters.Page = 1
	}

	offset := (filters.Page - 1) * filters.Limit
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, filters.Limit, offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("error querying vocabulary: %w", err)
	}
	defer rows.Close()

	var vocabulary []Vocabulary
	for rows.Next() {
		var v Vocabulary
		err := rows.Scan(
			&v.ID,
			&v.Chinese,
			&v.Traditional,
			&v.Pinyin,
			&v.PinyinNoTones,
			&v.English,
			&v.PartOfSpeech,
			&v.HSKLevel,
			&v.ExampleSentences,
			&v.CreatedAt,
			&v.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning vocabulary: %w", err)
		}
		vocabulary = append(vocabulary, v)
	}

	return &VocabularyListResponse{
		Vocabulary: vocabulary,
		Total:      total,
		Page:       filters.Page,
		Limit:      filters.Limit,
	}, nil
}

// GetByID retrieves a vocabulary item by ID
func (r *VocabularyRepository) GetByID(id uuid.UUID) (*Vocabulary, error) {
	query := `
		SELECT id, chinese, traditional, pinyin, pinyin_no_tones, english, part_of_speech, hsk_level, example_sentences, created_at, updated_at
		FROM vocabulary
		WHERE id = $1
	`

	var v Vocabulary
	err := r.db.QueryRow(query, id).Scan(
		&v.ID,
		&v.Chinese,
		&v.Traditional,
		&v.Pinyin,
		&v.PinyinNoTones,
		&v.English,
		&v.PartOfSpeech,
		&v.HSKLevel,
		&v.ExampleSentences,
		&v.CreatedAt,
		&v.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("error getting vocabulary by ID: %w", err)
	}

	return &v, nil
}

// GetByHSKLevel retrieves vocabulary by HSK level
func (r *VocabularyRepository) GetByHSKLevel(level int) ([]Vocabulary, error) {
	query := `
		SELECT id, chinese, traditional, pinyin, pinyin_no_tones, english, part_of_speech, hsk_level, example_sentences, created_at, updated_at
		FROM vocabulary
		WHERE hsk_level = $1
		ORDER BY chinese
	`

	rows, err := r.db.Query(query, level)
	if err != nil {
		return nil, fmt.Errorf("error querying vocabulary by HSK level: %w", err)
	}
	defer rows.Close()

	var vocabulary []Vocabulary
	for rows.Next() {
		var v Vocabulary
		err := rows.Scan(
			&v.ID,
			&v.Chinese,
			&v.Traditional,
			&v.Pinyin,
			&v.PinyinNoTones,
			&v.English,
			&v.PartOfSpeech,
			&v.HSKLevel,
			&v.ExampleSentences,
			&v.CreatedAt,
			&v.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning vocabulary: %w", err)
		}
		vocabulary = append(vocabulary, v)
	}

	return vocabulary, nil
}

// GetRandom retrieves random vocabulary items
func (r *VocabularyRepository) GetRandom(limit int, level *int) ([]Vocabulary, error) {
	query := `
		SELECT id, chinese, traditional, pinyin, pinyin_no_tones, english, part_of_speech, hsk_level, example_sentences, created_at, updated_at
		FROM vocabulary
	`
	args := []interface{}{}

	if level != nil {
		query += " WHERE hsk_level = $1"
		args = append(args, *level)
	} else {
		query += " WHERE hsk_level >= 1"
	}

	query += " ORDER BY RANDOM() LIMIT $"
	if level != nil {
		query += "2"
	} else {
		query += "1"
	}
	args = append(args, limit)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("error querying random vocabulary: %w", err)
	}
	defer rows.Close()

	var vocabulary []Vocabulary
	for rows.Next() {
		var v Vocabulary
		err := rows.Scan(
			&v.ID,
			&v.Chinese,
			&v.Traditional,
			&v.Pinyin,
			&v.PinyinNoTones,
			&v.English,
			&v.PartOfSpeech,
			&v.HSKLevel,
			&v.ExampleSentences,
			&v.CreatedAt,
			&v.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning vocabulary: %w", err)
		}
		vocabulary = append(vocabulary, v)
	}

	return vocabulary, nil
}
