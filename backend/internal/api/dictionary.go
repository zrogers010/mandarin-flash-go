package api

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"chinese-learning/internal/models"

	"github.com/gin-gonic/gin"
)

// DictionaryHandler handles dictionary search and lookup endpoints
type DictionaryHandler struct {
	vocabRepo *models.VocabularyRepository
	db        *sql.DB
}

// NewDictionaryHandler creates a new dictionary handler
func NewDictionaryHandler(db *sql.DB) *DictionaryHandler {
	return &DictionaryHandler{
		vocabRepo: models.NewVocabularyRepository(db),
		db:        db,
	}
}

// DictionarySearchResult extends a vocabulary item with search relevance
type DictionarySearchResult struct {
	models.Vocabulary
	MatchType string `json:"match_type"` // "exact", "prefix", "contains"
}

// Search handles GET /api/v1/dictionary/search?q=...&hsk_level=...&limit=...&page=...
func (h *DictionaryHandler) Search(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	if q == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Query parameter 'q' is required",
		})
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * limit

	var hskLevel *int
	if levelStr := c.Query("hsk_level"); levelStr != "" {
		if lv, err := strconv.Atoi(levelStr); err == nil && lv >= 1 && lv <= 6 {
			hskLevel = &lv
		}
	}

	// Build search query with ranked matching:
	//   1. Exact match on chinese, pinyin, or english
	//   2. Prefix match
	//   3. Contains match
	searchLower := strings.ToLower(q)
	searchLike := "%" + searchLower + "%"
	searchPrefix := searchLower + "%"

	query := `
		SELECT id, chinese, traditional, pinyin, COALESCE(pinyin_no_tones, '') as pinyin_no_tones,
			english, part_of_speech, hsk_level,
			COALESCE(example_sentences, '[]'::jsonb) as example_sentences,
			created_at, updated_at,
			CASE
				WHEN chinese = $1 OR pinyin ILIKE $1 OR pinyin_no_tones ILIKE $1 OR english ILIKE $1 THEN 'exact'
				WHEN chinese ILIKE $2 OR pinyin ILIKE $2 OR pinyin_no_tones ILIKE $2 OR english ILIKE $2 THEN 'prefix'
				ELSE 'contains'
			END as match_type
		FROM vocabulary
		WHERE (
			chinese ILIKE $3 OR
			pinyin ILIKE $3 OR
			pinyin_no_tones ILIKE $3 OR
			english ILIKE $3 OR
			traditional ILIKE $3
		)
	`

	args := []interface{}{q, searchPrefix, searchLike}
	argIndex := 4

	if hskLevel != nil {
		query += fmt.Sprintf(" AND hsk_level = $%d", argIndex)
		args = append(args, *hskLevel)
		argIndex++
	}

	// Count total before pagination
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM (%s) as sub", query)
	var total int
	if err := h.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed"})
		return
	}

	// Order by relevance: exact > prefix > contains, HSK words first, then alphabetically
	query += `
		ORDER BY
			CASE
				WHEN chinese = $1 OR pinyin ILIKE $1 OR pinyin_no_tones ILIKE $1 OR english ILIKE $1 THEN 1
				WHEN chinese ILIKE $2 OR pinyin ILIKE $2 OR pinyin_no_tones ILIKE $2 OR english ILIKE $2 THEN 2
				ELSE 3
			END,
			CASE WHEN hsk_level >= 1 THEN 0 ELSE 1 END,
			hsk_level ASC,
			pinyin_no_tones ASC
	`

	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argIndex, argIndex+1)
	args = append(args, limit, offset)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Search failed"})
		return
	}
	defer rows.Close()

	results := make([]DictionarySearchResult, 0)
	for rows.Next() {
		var r DictionarySearchResult
		err := rows.Scan(
			&r.ID, &r.Chinese, &r.Traditional, &r.Pinyin, &r.PinyinNoTones,
			&r.English, &r.PartOfSpeech, &r.HSKLevel,
			&r.ExampleSentences, &r.CreatedAt, &r.UpdatedAt,
			&r.MatchType,
		)
		if err != nil {
			continue
		}
		results = append(results, r)
	}

	c.JSON(http.StatusOK, gin.H{
		"results": results,
		"total":   total,
		"page":    page,
		"limit":   limit,
		"query":   q,
	})
}

// GetWord handles GET /api/v1/dictionary/:word
// Looks up a word by Chinese characters and returns full details
func (h *DictionaryHandler) GetWord(c *gin.Context) {
	word := strings.TrimSpace(c.Param("word"))
	if word == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Word parameter is required",
		})
		return
	}

	vocabSelect := `id, chinese, traditional, pinyin, COALESCE(pinyin_no_tones, '') as pinyin_no_tones,
		english, part_of_speech, hsk_level,
		COALESCE(example_sentences, '[]'::jsonb) as example_sentences,
		created_at, updated_at`

	// Try exact match on Chinese characters first
	query := fmt.Sprintf("SELECT %s FROM vocabulary WHERE chinese = $1 LIMIT 1", vocabSelect)

	var v models.Vocabulary
	err := h.db.QueryRow(query, word).Scan(
		&v.ID, &v.Chinese, &v.Traditional, &v.Pinyin, &v.PinyinNoTones,
		&v.English, &v.PartOfSpeech, &v.HSKLevel,
		&v.ExampleSentences, &v.CreatedAt, &v.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		pinyinQuery := fmt.Sprintf(`SELECT %s FROM vocabulary
			WHERE LOWER(pinyin) = LOWER($1) OR LOWER(pinyin_no_tones) = LOWER($1)
			LIMIT 1`, vocabSelect)
		err = h.db.QueryRow(pinyinQuery, word).Scan(
			&v.ID, &v.Chinese, &v.Traditional, &v.Pinyin, &v.PinyinNoTones,
			&v.English, &v.PartOfSpeech, &v.HSKLevel,
			&v.ExampleSentences, &v.CreatedAt, &v.UpdatedAt,
		)
	}

	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Word not found",
			"word":  word,
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to look up word",
		})
		return
	}

	relatedQuery := fmt.Sprintf(`SELECT %s FROM vocabulary
		WHERE hsk_level = $1 AND id != $2 ORDER BY RANDOM() LIMIT 5`, vocabSelect)
	rows, err := h.db.Query(relatedQuery, v.HSKLevel, v.ID)
	related := make([]models.Vocabulary, 0)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var rv models.Vocabulary
			if err := rows.Scan(
				&rv.ID, &rv.Chinese, &rv.Traditional, &rv.Pinyin, &rv.PinyinNoTones,
				&rv.English, &rv.PartOfSpeech, &rv.HSKLevel,
				&rv.ExampleSentences, &rv.CreatedAt, &rv.UpdatedAt,
			); err == nil {
				related = append(related, rv)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"word":          v,
		"related_words": related,
	})
}
