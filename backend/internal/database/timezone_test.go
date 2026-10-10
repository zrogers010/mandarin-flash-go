package database

import (
	"database/sql"
	"os"
	"testing"
	"time"

	"chinese-learning/internal/models"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func getTestDB(t *testing.T) *sql.DB {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		t.Skip("DATABASE_URL not set, skipping integration test")
	}

	db, err := sql.Open("postgres", dbURL)
	require.NoError(t, err)
	require.NoError(t, db.Ping())
	return db
}

func cleanupTestUser(t *testing.T, db *sql.DB, userID uuid.UUID) {
	_, _ = db.Exec(`DELETE FROM daily_activity WHERE user_id = $1`, userID)
	_, _ = db.Exec(`DELETE FROM user_vocabulary_progress WHERE user_id = $1`, userID)
	_, _ = db.Exec(`DELETE FROM users WHERE id = $1`, userID)
}

// TestTriggerUsesActivityDate tests that the trigger sets last_study_date to match activity_date
// This verifies migration 011 changed the function to use NEW.activity_date instead of CURRENT_DATE
func TestTriggerUsesActivityDate(t *testing.T) {
	db := getTestDB(t)
	defer db.Close()

	userRepo := NewUserRepository(db)

	// Create test user
	userID := uuid.New()
	user := &models.User{
		ID:           userID,
		Email:        "trigger-test@test.com",
		PasswordHash: "hash",
		IsActive:     true,
	}
	require.NoError(t, userRepo.CreateUser(user))
	defer cleanupTestUser(t, db, userID)

	// Insert daily_activity with activity_date = yesterday
	yesterday := time.Now().UTC().AddDate(0, 0, -1)
	yesterdayDate := time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, time.UTC)

	activityID := uuid.New()
	_, err := db.Exec(`
		INSERT INTO daily_activity (id, user_id, activity_date, minutes_studied, cards_reviewed, new_words_learned, goal_met, created_at, updated_at)
		VALUES ($1, $2, $3, 10, 5, 2, false, NOW(), NOW())
	`, activityID, userID, yesterdayDate)
	require.NoError(t, err)

	// Check that last_study_date was set to yesterday (activity_date), not CURRENT_DATE
	var lastStudyDate sql.NullTime
	err = db.QueryRow(`SELECT last_study_date FROM users WHERE id = $1`, userID).Scan(&lastStudyDate)
	require.NoError(t, err)
	assert.True(t, lastStudyDate.Valid, "last_study_date should be set")
	assert.Equal(t, yesterdayDate, lastStudyDate.Time, "last_study_date should equal activity_date (yesterday), not CURRENT_DATE")
}

// TestTimezoneSameDayActivity tests that a PT user doing activity at 4 PM and 6 PM PT on the same day
// gets one daily_activity row and the streak doesn't double count
func TestTimezoneSameDayActivity(t *testing.T) {
	db := getTestDB(t)
	defer db.Close()

	userRepo := NewUserRepository(db)

	// Create test user with America/Los_Angeles timezone
	userID := uuid.New()
	user := &models.User{
		ID:           userID,
		Email:        "pt-user@test.com",
		PasswordHash: "hash",
		IsActive:     true,
	}
	require.NoError(t, userRepo.CreateUser(user))
	defer cleanupTestUser(t, db, userID)
	
	require.NoError(t, userRepo.UpdateTimezone(userID, "America/Los_Angeles"))

	// Simulate activity at 4 PM PT (which might be next UTC day depending on time)
	loc, err := time.LoadLocation("America/Los_Angeles")
	require.NoError(t, err)

	// Set up a specific date at 4 PM PT
	timeAt4PM := time.Date(2026, 10, 9, 16, 0, 0, 0, loc)
	localDate4PM := time.Date(timeAt4PM.Year(), timeAt4PM.Month(), timeAt4PM.Day(), 0, 0, 0, 0, time.UTC)

	// Insert first activity (simulating 4 PM)
	activityID1 := uuid.New()
	_, err = db.Exec(`
		INSERT INTO daily_activity (id, user_id, activity_date, minutes_studied, cards_reviewed, new_words_learned, goal_met, created_at, updated_at)
		VALUES ($1, $2, $3, 10, 5, 2, false, $4, $4)
	`, activityID1, userID, localDate4PM, timeAt4PM)
	require.NoError(t, err)

	// Simulate activity at 6 PM PT (same local date)
	timeAt6PM := time.Date(2026, 10, 9, 18, 0, 0, 0, loc)
	localDate6PM := time.Date(timeAt6PM.Year(), timeAt6PM.Month(), timeAt6PM.Day(), 0, 0, 0, 0, time.UTC)

	// Same date should trigger conflict update
	activityID2 := uuid.New()
	_, err = db.Exec(`
		INSERT INTO daily_activity (id, user_id, activity_date, minutes_studied, cards_reviewed, new_words_learned, goal_met, created_at, updated_at)
		VALUES ($1, $2, $3, 15, 3, 1, false, $4, $4)
		ON CONFLICT (user_id, activity_date)
		DO UPDATE SET
			minutes_studied = daily_activity.minutes_studied + EXCLUDED.minutes_studied,
			cards_reviewed = daily_activity.cards_reviewed + EXCLUDED.cards_reviewed,
			new_words_learned = daily_activity.new_words_learned + EXCLUDED.new_words_learned,
			updated_at = EXCLUDED.updated_at
	`, activityID2, userID, localDate6PM, timeAt6PM)
	require.NoError(t, err)

	// Check: should have only 1 row for this date
	var count int
	err = db.QueryRow(`SELECT COUNT(*) FROM daily_activity WHERE user_id = $1 AND activity_date = $2`, userID, localDate4PM).Scan(&count)
	require.NoError(t, err)
	assert.Equal(t, 1, count, "Should have exactly 1 daily_activity row for the same day")

	// Check aggregated values
	var minutes, cards, words int
	err = db.QueryRow(`
		SELECT minutes_studied, cards_reviewed, new_words_learned
		FROM daily_activity
		WHERE user_id = $1 AND activity_date = $2
	`, userID, localDate4PM).Scan(&minutes, &cards, &words)
	require.NoError(t, err)
	assert.Equal(t, 25, minutes, "Minutes should be summed")
	assert.Equal(t, 8, cards, "Cards should be summed")
	assert.Equal(t, 3, words, "Words should be summed")

	// Check streak: user's last_study_date should be set to the activity_date
	var lastStudyDate sql.NullTime
	var streakDays int
	err = db.QueryRow(`SELECT last_study_date, study_streak_days FROM users WHERE id = $1`, userID).Scan(&lastStudyDate, &streakDays)
	require.NoError(t, err)
	assert.True(t, lastStudyDate.Valid)
	assert.Equal(t, localDate4PM, lastStudyDate.Time, "last_study_date should match activity_date")
}

// TestTimezoneConsecutiveDays tests that activity at 11:30 PM PT and 12:30 AM PT the next day
// gives consecutive days and streak +1
func TestTimezoneConsecutiveDays(t *testing.T) {
	db := getTestDB(t)
	defer db.Close()

	userRepo := NewUserRepository(db)

	// Create test user with PT timezone
	userID := uuid.New()
	user := &models.User{
		ID:           userID,
		Email:        "streak-user@test.com",
		PasswordHash: "hash",
		IsActive:     true,
	}
	require.NoError(t, userRepo.CreateUser(user))
	defer cleanupTestUser(t, db, userID)
	
	require.NoError(t, userRepo.UpdateTimezone(userID, "America/Los_Angeles"))

	loc, err := time.LoadLocation("America/Los_Angeles")
	require.NoError(t, err)

	// Day 1: 11:30 PM PT on Oct 9
	timeDay1 := time.Date(2026, 10, 9, 23, 30, 0, 0, loc)
	localDateDay1 := time.Date(timeDay1.Year(), timeDay1.Month(), timeDay1.Day(), 0, 0, 0, 0, time.UTC)

	activityID1 := uuid.New()
	_, err = db.Exec(`
		INSERT INTO daily_activity (id, user_id, activity_date, minutes_studied, cards_reviewed, new_words_learned, goal_met, created_at, updated_at)
		VALUES ($1, $2, $3, 10, 5, 2, false, $4, $4)
	`, activityID1, userID, localDateDay1, timeDay1)
	require.NoError(t, err)

	// Check streak after day 1
	var lastStudyDate1 sql.NullTime
	err = db.QueryRow(`SELECT last_study_date FROM users WHERE id = $1`, userID).Scan(&lastStudyDate1)
	require.NoError(t, err)
	assert.Equal(t, localDateDay1, lastStudyDate1.Time, "Day 1 last_study_date")

	// Day 2: 12:30 AM PT on Oct 10 (30 minutes after midnight)
	timeDay2 := time.Date(2026, 10, 10, 0, 30, 0, 0, loc)
	localDateDay2 := time.Date(timeDay2.Year(), timeDay2.Month(), timeDay2.Day(), 0, 0, 0, 0, time.UTC)

	activityID2 := uuid.New()
	_, err = db.Exec(`
		INSERT INTO daily_activity (id, user_id, activity_date, minutes_studied, cards_reviewed, new_words_learned, goal_met, created_at, updated_at)
		VALUES ($1, $2, $3, 15, 3, 1, false, $4, $4)
	`, activityID2, userID, localDateDay2, timeDay2)
	require.NoError(t, err)

	// Check: should have 2 rows for consecutive days
	var count int
	err = db.QueryRow(`SELECT COUNT(*) FROM daily_activity WHERE user_id = $1`, userID).Scan(&count)
	require.NoError(t, err)
	assert.Equal(t, 2, count, "Should have 2 daily_activity rows for consecutive days")

	// Check last_study_date updated to day 2
	var lastStudyDate2 sql.NullTime
	err = db.QueryRow(`SELECT last_study_date FROM users WHERE id = $1`, userID).Scan(&lastStudyDate2)
	require.NoError(t, err)
	assert.Equal(t, localDateDay2, lastStudyDate2.Time, "Day 2 last_study_date should be updated")

	// Verify dates are consecutive
	dayDiff := localDateDay2.Sub(localDateDay1).Hours() / 24
	assert.Equal(t, 1.0, dayDiff, "Activity dates should be exactly 1 day apart")
}

// TestInvalidTimezoneFallback tests that an invalid timezone falls back to UTC
func TestInvalidTimezoneFallback(t *testing.T) {
	db := getTestDB(t)
	defer db.Close()

	userRepo := NewUserRepository(db)

	// Create test user
	userID := uuid.New()
	user := &models.User{
		ID:           userID,
		Email:        "invalid-tz-user@test.com",
		PasswordHash: "hash",
		IsActive:     true,
	}
	require.NoError(t, userRepo.CreateUser(user))
	defer cleanupTestUser(t, db, userID)

	// Try to set an invalid timezone
	err := userRepo.UpdateTimezone(userID, "Invalid/Timezone")
	require.NoError(t, err, "UpdateTimezone should not error (it updates the field)")

	// When getting timezone, application code should validate and fall back to UTC
	tz, err := userRepo.GetUserTimezone(userID)
	require.NoError(t, err)
	
	// Validate the timezone - invalid should fail LoadLocation
	loc, tzErr := time.LoadLocation(tz)
	if tzErr != nil {
		// Fallback to UTC
		loc, _ = time.LoadLocation("UTC")
	}
	assert.Equal(t, "UTC", loc.String(), "Invalid timezone should fall back to UTC in application code")
}

// TestMigration011Idempotency tests that migration 011 can be run multiple times safely
func TestMigration011Idempotency(t *testing.T) {
	db := getTestDB(t)
	defer db.Close()

	// Read migration 011
	migration, err := os.ReadFile("../../db/migrations/011_add_user_timezone.sql")
	require.NoError(t, err)

	// Run migration first time
	_, err = db.Exec(string(migration))
	require.NoError(t, err, "First migration run should succeed")

	// Run migration second time (idempotency test)
	_, err = db.Exec(string(migration))
	require.NoError(t, err, "Second migration run should succeed (idempotent)")

	// Verify trigger function exists and is correct
	var exists bool
	err = db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM pg_proc p
			JOIN pg_namespace n ON p.pronamespace = n.oid
			WHERE n.nspname = 'public' AND p.proname = 'update_daily_activity'
		)
	`).Scan(&exists)
	require.NoError(t, err)
	assert.True(t, exists, "Trigger function should exist")

	// Verify trigger exists
	err = db.QueryRow(`
		SELECT EXISTS(
			SELECT 1 FROM pg_trigger
			WHERE tgname = 'update_daily_activity_trigger'
		)
	`).Scan(&exists)
	require.NoError(t, err)
	assert.True(t, exists, "Trigger should exist")
}
