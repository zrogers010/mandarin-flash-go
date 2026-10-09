package api

import (
	"database/sql"
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
	// Delete test users and cascade will handle related data
	_, err = db.Exec(`
		DELETE FROM users 
		WHERE email LIKE 'test%' OR username LIKE 'test%'
	`)
	if err != nil {
		t.Logf("Warning: Could not clean users: %v", err)
	}

	// Also clean up test vocabulary that may conflict
	_, err = db.Exec(`
		DELETE FROM vocabulary 
		WHERE (english LIKE 'test%' OR chinese LIKE '%测试%') 
		AND hsk_level = 1
	`)
	if err != nil {
		t.Logf("Warning: Could not clean test vocabulary: %v", err)
	}

	return db
}
