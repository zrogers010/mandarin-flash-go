package api

import (
	"database/sql"
	"fmt"
	"os"
	"strings"
	"testing"

	_ "github.com/lib/pq"
)

// setupTestDB creates a real database connection for integration tests
// It expects DATABASE_URL env var to be set (e.g., in CI)
// Safety: Only connects to databases with "test" in the name or when CI=true
func setupTestDB(t *testing.T) *sql.DB {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		t.Skip("DATABASE_URL not set, skipping integration test")
	}

	// Safety check: Only allow test databases or CI environment
	// This prevents accidental production data deletion
	isCI := os.Getenv("CI") == "true" || os.Getenv("GITHUB_ACTIONS") == "true"
	hasTestInURL := strings.Contains(strings.ToLower(dbURL), "test")
	
	if !isCI && !hasTestInURL {
		t.Fatalf("Safety check failed: DATABASE_URL must contain 'test' or CI must be true. Got: %s", dbURL)
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		t.Fatalf("Failed to connect to test database: %v", err)
	}

	if err := db.Ping(); err != nil {
		t.Fatalf("Failed to ping test database: %v", err)
	}

	// Get the database name for additional safety check
	var dbName string
	err = db.QueryRow("SELECT current_database()").Scan(&dbName)
	if err != nil {
		t.Fatalf("Failed to get database name: %v", err)
	}

	// Double-check the database name contains "test"
	if !isCI && !strings.Contains(strings.ToLower(dbName), "test") {
		t.Fatalf("Safety check failed: Database name must contain 'test' or CI must be true. Database: %s", dbName)
	}

	// Clean up test data before each test
	// Only delete rows that are clearly test data
	tables := []string{
		"daily_activity",
		"user_vocabulary_progress",
		"quiz_results",
		"users",
	}
	
	for _, table := range tables {
		// Try to delete only test rows by email/username pattern
		_, err := db.Exec(fmt.Sprintf("DELETE FROM %s WHERE email LIKE 'test%%' OR username LIKE 'test%%'", table))
		if err != nil {
			// If the table doesn't have email/username columns, skip cleanup for safety
			// We don't want to TRUNCATE CASCADE in case we're somehow in the wrong database
			t.Logf("Warning: Could not clean %s by test pattern: %v", table, err)
		}
	}

	return db
}
