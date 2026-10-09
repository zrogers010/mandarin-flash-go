package api

import (
	"database/sql"
	"fmt"
	"os"
	"testing"

	_ "github.com/lib/pq"
)

// setupTestDB creates a real database connection for integration tests
// It expects DATABASE_URL env var to be set (e.g., in CI)
func setupTestDB(t *testing.T) *sql.DB {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		t.Skip("DATABASE_URL not set, skipping integration test")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	if err := db.Ping(); err != nil {
		t.Fatalf("Failed to ping test database: %v", err)
	}

	// Clean up test data before each test
	tables := []string{
		"daily_activity",
		"user_vocabulary_progress",
		"quiz_results",
		"vocabulary",
		"users",
	}
	
	for _, table := range tables {
		_, err := db.Exec(fmt.Sprintf("DELETE FROM %s WHERE email LIKE 'test%%' OR username LIKE 'test%%'", table))
		if err != nil {
			// Ignore errors for tables without email/username columns
			_, _ = db.Exec(fmt.Sprintf("TRUNCATE %s CASCADE", table))
		}
	}

	return db
}
