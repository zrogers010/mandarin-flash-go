package database

import (
	"database/sql"
	"fmt"
	"time"

	"chinese-learning/internal/models"

	"github.com/google/uuid"
)

// UserRepositoryImpl implements the UserRepository interface
type UserRepositoryImpl struct {
	db *sql.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *sql.DB) models.UserRepository {
	return &UserRepositoryImpl{db: db}
}

// CreateUser creates a new user
func (r *UserRepositoryImpl) CreateUser(user *models.User) error {
	query := `
		INSERT INTO users (id, email, username, password_hash, is_verified, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`

	now := time.Now()
	_, err := r.db.Exec(query,
		user.ID,
		user.Email,
		user.Username,
		user.PasswordHash,
		user.IsVerified,
		user.IsActive,
		now,
		now,
	)

	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}

	user.CreatedAt = now
	user.UpdatedAt = now
	return nil
}

// GetUserByID retrieves a user by ID
func (r *UserRepositoryImpl) GetUserByID(id uuid.UUID) (*models.User, error) {
	query := `
		SELECT id, email, username, password_hash, is_verified, is_active, 
		       last_login_at, created_at, updated_at
		FROM users 
		WHERE id = $1
	`

	user := &models.User{}
	var lastLoginAt sql.NullTime

	err := r.db.QueryRow(query, id).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.PasswordHash,
		&user.IsVerified,
		&user.IsActive,
		&lastLoginAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}

	return user, nil
}

// GetUserByEmail retrieves a user by email
func (r *UserRepositoryImpl) GetUserByEmail(email string) (*models.User, error) {
	query := `
		SELECT id, email, username, password_hash, is_verified, is_active, 
		       last_login_at, created_at, updated_at
		FROM users 
		WHERE email = $1
	`

	user := &models.User{}
	var lastLoginAt sql.NullTime

	err := r.db.QueryRow(query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.PasswordHash,
		&user.IsVerified,
		&user.IsActive,
		&lastLoginAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}

	return user, nil
}

// UpdateUser updates a user
func (r *UserRepositoryImpl) UpdateUser(user *models.User) error {
	query := `
		UPDATE users 
		SET email = $2, username = $3, password_hash = $4,
		    is_verified = $5, is_active = $6, updated_at = $7
		WHERE id = $1
	`

	_, err := r.db.Exec(query,
		user.ID,
		user.Email,
		user.Username,
		user.PasswordHash,
		user.IsVerified,
		user.IsActive,
		time.Now(),
	)

	if err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}

// DeleteUser deletes a user
func (r *UserRepositoryImpl) DeleteUser(id uuid.UUID) error {
	query := `DELETE FROM users WHERE id = $1`

	_, err := r.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	return nil
}

// VerifyUserEmail verifies a user's email
func (r *UserRepositoryImpl) VerifyUserEmail(id uuid.UUID) error {
	query := `UPDATE users SET is_verified = true, updated_at = $2 WHERE id = $1`

	_, err := r.db.Exec(query, id, time.Now())
	if err != nil {
		return fmt.Errorf("failed to verify user email: %w", err)
	}

	return nil
}

// UpdateLastLogin updates the user's last login time
func (r *UserRepositoryImpl) UpdateLastLogin(id uuid.UUID) error {
	query := `UPDATE users SET last_login_at = $2, updated_at = $3 WHERE id = $1`

	_, err := r.db.Exec(query, id, time.Now(), time.Now())
	if err != nil {
		return fmt.Errorf("failed to update last login: %w", err)
	}

	return nil
}

// CreateEmailVerificationToken creates an email verification token
func (r *UserRepositoryImpl) CreateEmailVerificationToken(token *models.EmailVerificationToken) error {
	query := `
		INSERT INTO email_verification_tokens (id, user_id, token, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`

	_, err := r.db.Exec(query,
		token.ID,
		token.UserID,
		token.Token,
		token.ExpiresAt,
		token.CreatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create email verification token: %w", err)
	}

	return nil
}

// GetEmailVerificationToken retrieves an email verification token
func (r *UserRepositoryImpl) GetEmailVerificationToken(token string) (*models.EmailVerificationToken, error) {
	query := `
		SELECT id, user_id, token, expires_at, used_at, created_at
		FROM email_verification_tokens 
		WHERE token = $1
	`

	verificationToken := &models.EmailVerificationToken{}
	var usedAt sql.NullTime

	err := r.db.QueryRow(query, token).Scan(
		&verificationToken.ID,
		&verificationToken.UserID,
		&verificationToken.Token,
		&verificationToken.ExpiresAt,
		&usedAt,
		&verificationToken.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("email verification token not found")
		}
		return nil, fmt.Errorf("failed to get email verification token: %w", err)
	}

	if usedAt.Valid {
		verificationToken.UsedAt = &usedAt.Time
	}

	return verificationToken, nil
}

// UseEmailVerificationToken marks an email verification token as used
func (r *UserRepositoryImpl) UseEmailVerificationToken(token string) error {
	query := `UPDATE email_verification_tokens SET used_at = $2 WHERE token = $1`

	_, err := r.db.Exec(query, token, time.Now())
	if err != nil {
		return fmt.Errorf("failed to use email verification token: %w", err)
	}

	return nil
}

// CreatePasswordResetToken creates a password reset token
func (r *UserRepositoryImpl) CreatePasswordResetToken(token *models.PasswordResetToken) error {
	query := `
		INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`

	_, err := r.db.Exec(query,
		token.ID,
		token.UserID,
		token.Token,
		token.ExpiresAt,
		token.CreatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create password reset token: %w", err)
	}

	return nil
}

// GetPasswordResetToken retrieves a password reset token
func (r *UserRepositoryImpl) GetPasswordResetToken(token string) (*models.PasswordResetToken, error) {
	query := `
		SELECT id, user_id, token, expires_at, used_at, created_at
		FROM password_reset_tokens 
		WHERE token = $1
	`

	resetToken := &models.PasswordResetToken{}
	var usedAt sql.NullTime

	err := r.db.QueryRow(query, token).Scan(
		&resetToken.ID,
		&resetToken.UserID,
		&resetToken.Token,
		&resetToken.ExpiresAt,
		&usedAt,
		&resetToken.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("password reset token not found")
		}
		return nil, fmt.Errorf("failed to get password reset token: %w", err)
	}

	if usedAt.Valid {
		resetToken.UsedAt = &usedAt.Time
	}

	return resetToken, nil
}

// UsePasswordResetToken marks a password reset token as used
func (r *UserRepositoryImpl) UsePasswordResetToken(token string) error {
	query := `UPDATE password_reset_tokens SET used_at = $2 WHERE token = $1`

	_, err := r.db.Exec(query, token, time.Now())
	if err != nil {
		return fmt.Errorf("failed to use password reset token: %w", err)
	}

	return nil
}

// CreateSession creates a user session
func (r *UserRepositoryImpl) CreateSession(session *models.UserSession) error {
	query := `
		INSERT INTO user_sessions (id, user_id, token_hash, expires_at, ip_address, user_agent, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	_, err := r.db.Exec(query,
		session.ID,
		session.UserID,
		session.TokenHash,
		session.ExpiresAt,
		session.IPAddress,
		session.UserAgent,
		session.CreatedAt,
	)

	if err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}

	return nil
}

// GetSessionByTokenHash retrieves a session by token hash
func (r *UserRepositoryImpl) GetSessionByTokenHash(tokenHash string) (*models.UserSession, error) {
	query := `
		SELECT id, user_id, token_hash, expires_at, ip_address, user_agent, created_at
		FROM user_sessions 
		WHERE token_hash = $1
	`

	session := &models.UserSession{}

	err := r.db.QueryRow(query, tokenHash).Scan(
		&session.ID,
		&session.UserID,
		&session.TokenHash,
		&session.ExpiresAt,
		&session.IPAddress,
		&session.UserAgent,
		&session.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("session not found")
		}
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	return session, nil
}

// DeleteSession deletes a session
func (r *UserRepositoryImpl) DeleteSession(tokenHash string) error {
	query := `DELETE FROM user_sessions WHERE token_hash = $1`

	_, err := r.db.Exec(query, tokenHash)
	if err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}

	return nil
}

// GetUserSessions retrieves all active sessions for a user
func (r *UserRepositoryImpl) GetUserSessions(userID uuid.UUID) ([]models.UserSession, error) {
	query := `
		SELECT id, user_id, token_hash, expires_at, ip_address, user_agent, created_at
		FROM user_sessions 
		WHERE user_id = $1 AND expires_at > NOW()
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user sessions: %w", err)
	}
	defer rows.Close()

	var sessions []models.UserSession
	for rows.Next() {
		var session models.UserSession
		err := rows.Scan(
			&session.ID,
			&session.UserID,
			&session.TokenHash,
			&session.ExpiresAt,
			&session.IPAddress,
			&session.UserAgent,
			&session.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan session: %w", err)
		}
		sessions = append(sessions, session)
	}

	if sessions == nil {
		sessions = []models.UserSession{}
	}

	return sessions, nil
}

// DeleteUserSessions deletes all sessions for a user
func (r *UserRepositoryImpl) DeleteUserSessions(userID uuid.UUID) error {
	query := `DELETE FROM user_sessions WHERE user_id = $1`

	_, err := r.db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("failed to delete user sessions: %w", err)
	}

	return nil
}

// DeleteSessionByID deletes a specific session by ID, scoped to a user
func (r *UserRepositoryImpl) DeleteSessionByID(sessionID uuid.UUID, userID uuid.UUID) error {
	query := `DELETE FROM user_sessions WHERE id = $1 AND user_id = $2`

	result, err := r.db.Exec(query, sessionID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to check rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("session not found")
	}

	return nil
}

// CleanupExpiredTokens removes expired tokens and sessions
func (r *UserRepositoryImpl) CleanupExpiredTokens() error {
	query := `SELECT cleanup_expired_tokens()`

	_, err := r.db.Exec(query)
	if err != nil {
		return fmt.Errorf("failed to cleanup expired tokens: %w", err)
	}

	return nil
}






































































