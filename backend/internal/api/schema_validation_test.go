package api

import (
	"database/sql"
	"fmt"
	"os"
	"regexp"
	"strings"
	"testing"

	_ "github.com/lib/pq"
)

// TestSchemaColumnValidation validates that all SQL queries in the codebase
// reference only columns that exist in the database schema
func TestSchemaColumnValidation(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping schema validation test")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		t.Skip("DATABASE_URL not set, skipping schema validation test")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		t.Fatalf("Failed to ping test database: %v", err)
	}

	// Get the actual schema columns for key tables
	tableColumns := make(map[string]map[string]bool)
	tables := []string{
		"users",
		"vocabulary",
		"user_vocabulary_progress",
		"daily_activity",
		"quiz_results",
		"learning_goals",
	}

	for _, table := range tables {
		columns := make(map[string]bool)
		rows, err := db.Query(`
			SELECT column_name 
			FROM information_schema.columns 
			WHERE table_name = $1 AND table_schema = 'public'
		`, table)
		if err != nil {
			t.Fatalf("Failed to query columns for %s: %v", table, err)
		}
		defer rows.Close()

		for rows.Next() {
			var col string
			if err := rows.Scan(&col); err != nil {
				t.Fatalf("Failed to scan column: %v", err)
			}
			columns[col] = true
		}
		tableColumns[table] = columns
	}

	// Common SQL column references that should NOT exist (but were bugs in the past)
	invalidColumns := map[string][]string{
		"user_vocabulary_progress": {"level", "due_date", "times_reviewed", "times_incorrect"},
	}

	for table, cols := range invalidColumns {
		actualCols := tableColumns[table]
		for _, col := range cols {
			if actualCols[col] {
				t.Errorf("Table %s should NOT have column %s (this was a bug we fixed)", table, col)
			}
		}
	}

	// Validate that required columns DO exist
	requiredColumns := map[string][]string{
		"user_vocabulary_progress": {
			"id", "user_id", "vocabulary_id", "ease_factor", "interval_days",
			"repetitions", "next_review_at", "times_seen", "times_correct",
		},
		"daily_activity": {
			"id", "user_id", "activity_date", "minutes_studied", "cards_reviewed",
			"new_words_learned", "quizzes_completed", "goal_met",
		},
	}

	for table, cols := range requiredColumns {
		actualCols := tableColumns[table]
		for _, col := range cols {
			if !actualCols[col] {
				t.Errorf("Table %s is missing required column %s", table, col)
			}
		}
	}

	// Test actual queries from the codebase to ensure they execute without column errors
	testQueries := []struct {
		name  string
		query string
		args  []interface{}
	}{
		{
			name: "user_vocabulary_progress insert (from guest.go)",
			query: `
				INSERT INTO user_vocabulary_progress (
					user_id, vocabulary_id, ease_factor, interval_days, repetitions, 
					next_review_at, times_seen, times_correct
				)
				VALUES ($1, $2, 2.5, 0, 0, NOW(), 0, 0)
				ON CONFLICT (user_id, vocabulary_id) DO NOTHING
			`,
			args: []interface{}{"00000000-0000-0000-0000-000000000001", "00000000-0000-0000-0000-000000000002"},
		},
		{
			name: "daily_activity insert for quiz (from quiz.go)",
			query: `
				INSERT INTO daily_activity (
					id, user_id, activity_date, minutes_studied, cards_reviewed, new_words_learned, quizzes_completed, goal_met, created_at, updated_at
				)
				VALUES ($1, $2, CURRENT_DATE, 0, 0, 0, 1, false, NOW(), NOW())
				ON CONFLICT (user_id, activity_date)
				DO UPDATE SET
					quizzes_completed = daily_activity.quizzes_completed + 1,
					updated_at = NOW()
			`,
			args: []interface{}{"00000000-0000-0000-0000-000000000003", "00000000-0000-0000-0000-000000000001"},
		},
	}

	for _, tc := range testQueries {
		t.Run(tc.name, func(t *testing.T) {
			// Use EXPLAIN to validate the query without executing it
			explainQuery := "EXPLAIN " + tc.query
			_, err := db.Exec(explainQuery, tc.args...)
			if err != nil {
				// Check if it's a column-related error
				if strings.Contains(err.Error(), "column") && strings.Contains(err.Error(), "does not exist") {
					t.Errorf("Query references non-existent column: %v\nQuery: %s", err, tc.query)
				} else {
					// Other errors (like missing tables) are acceptable for EXPLAIN
					t.Logf("Query validation note (non-critical): %v", err)
				}
			}
		})
	}
}

// extractTableAndColumn attempts to extract table and column from SQL
// This is a simple heuristic parser for validation purposes
func extractTableAndColumn(query string) (table, column string) {
	// Simple regex to find "table.column" or "column" in INSERT/UPDATE/SELECT
	re := regexp.MustCompile(`(?i)(?:FROM|INTO|UPDATE)\s+(\w+)`)
	matches := re.FindStringSubmatch(query)
	if len(matches) > 1 {
		table = matches[1]
	}
	return table, ""
}
