package database

import (
	"database/sql"
	"os"
	"testing"
	"time"

	"chinese-learning/internal/auth"
	"chinese-learning/internal/models"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func getAuthTokensTestDB(t *testing.T) *sql.DB {
	t.Helper()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		host := os.Getenv("DB_HOST")
		if host == "" {
			t.Skip("DATABASE_URL/DB_HOST not set, skipping integration test")
		}
		port := os.Getenv("DB_PORT")
		if port == "" {
			port = "5432"
		}
		name := os.Getenv("DB_NAME")
		if name == "" {
			name = "chinese_learning_test"
		}
		user := os.Getenv("DB_USER")
		if user == "" {
			user = "postgres"
		}
		pass := os.Getenv("DB_PASSWORD")
		if pass == "" {
			pass = "postgres"
		}
		dbURL = "postgres://" + user + ":" + pass + "@" + host + ":" + port + "/" + name + "?sslmode=disable"
	}

	db, err := sql.Open("postgres", dbURL)
	require.NoError(t, err)
	require.NoError(t, db.Ping())
	return db
}

func TestPasswordResetTokensAreHashedAndInvalidated(t *testing.T) {
	db := getAuthTokensTestDB(t)
	defer db.Close()
	repo := NewUserRepository(db)

	userID := uuid.New()
	require.NoError(t, repo.CreateUser(&models.User{
		ID:           userID,
		Email:        "reset-hash-" + userID.String() + "@test.com",
		PasswordHash: "hash",
		IsActive:     true,
	}))
	defer cleanupTestUser(t, db, userID)

	raw1, err := auth.GenerateSecureToken()
	require.NoError(t, err)
	require.NoError(t, repo.CreatePasswordResetToken(&models.PasswordResetToken{
		ID:        uuid.New(),
		UserID:    userID,
		Token:     raw1,
		ExpiresAt: time.Now().Add(time.Hour),
		CreatedAt: time.Now(),
	}))

	var stored string
	require.NoError(t, db.QueryRow(
		`SELECT token FROM password_reset_tokens WHERE user_id = $1`, userID,
	).Scan(&stored))
	assert.Equal(t, auth.HashToken(raw1), stored)
	assert.NotEqual(t, raw1, stored)

	got, err := repo.GetPasswordResetToken(raw1)
	require.NoError(t, err)
	assert.Equal(t, userID, got.UserID)

	// Outstanding plaintext row still resolves.
	rawPlain, err := auth.GenerateSecureToken()
	require.NoError(t, err)
	_, err = db.Exec(
		`INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at) VALUES ($1, $2, $3, $4, $5)`,
		uuid.New(), userID, rawPlain, time.Now().Add(time.Hour), time.Now(),
	)
	require.NoError(t, err)
	plainGot, err := repo.GetPasswordResetToken(rawPlain)
	require.NoError(t, err)
	assert.Equal(t, userID, plainGot.UserID)

	require.NoError(t, repo.InvalidateUnusedPasswordResetTokens(userID))
	_, err = repo.ConsumePasswordResetToken(raw1)
	require.Error(t, err, "invalidated token must not be consumable")

	raw2, err := auth.GenerateSecureToken()
	require.NoError(t, err)
	require.NoError(t, repo.CreatePasswordResetToken(&models.PasswordResetToken{
		ID:        uuid.New(),
		UserID:    userID,
		Token:     raw2,
		ExpiresAt: time.Now().Add(time.Hour),
		CreatedAt: time.Now(),
	}))
	first, err := repo.ConsumePasswordResetToken(raw2)
	require.NoError(t, err)
	assert.Equal(t, userID, first.UserID)
	_, err = repo.ConsumePasswordResetToken(raw2)
	require.Error(t, err, "second consume must fail")
}
