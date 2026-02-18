package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user in the system
type User struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	Email        string     `json:"email" db:"email"`
	Username     *string    `json:"username,omitempty" db:"username"`
	PasswordHash string     `json:"-" db:"password_hash"` // Hidden from JSON
	IsVerified   bool       `json:"is_verified" db:"is_verified"`
	IsActive     bool       `json:"is_active" db:"is_active"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty" db:"last_login_at"`
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at" db:"updated_at"`
}

// DisplayName returns the best available display name for the user
func (u *User) DisplayName() string {
	if u.Username != nil && *u.Username != "" {
		return *u.Username
	}
	return u.Email
}

// EmailVerificationToken represents an email verification token
type EmailVerificationToken struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	UserID    uuid.UUID  `json:"user_id" db:"user_id"`
	Token     string     `json:"token" db:"token"`
	ExpiresAt time.Time  `json:"expires_at" db:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty" db:"used_at"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
}

// PasswordResetToken represents a password reset token
type PasswordResetToken struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	UserID    uuid.UUID  `json:"user_id" db:"user_id"`
	Token     string     `json:"token" db:"token"`
	ExpiresAt time.Time  `json:"expires_at" db:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty" db:"used_at"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
}

// UserSession represents an active user session
type UserSession struct {
	ID        uuid.UUID `json:"id" db:"id"`
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	TokenHash string    `json:"-" db:"token_hash"` // Hidden from JSON
	ExpiresAt time.Time `json:"expires_at" db:"expires_at"`
	IPAddress *string   `json:"ip_address,omitempty" db:"ip_address"`
	UserAgent *string   `json:"user_agent,omitempty" db:"user_agent"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// UserRepository interface for user database operations
type UserRepository interface {
	CreateUser(user *User) error
	GetUserByID(id uuid.UUID) (*User, error)
	GetUserByEmail(email string) (*User, error)
	UpdateUser(user *User) error
	DeleteUser(id uuid.UUID) error
	VerifyUserEmail(id uuid.UUID) error
	UpdateLastLogin(id uuid.UUID) error

	// Token operations
	CreateEmailVerificationToken(token *EmailVerificationToken) error
	GetEmailVerificationToken(token string) (*EmailVerificationToken, error)
	UseEmailVerificationToken(token string) error
	CreatePasswordResetToken(token *PasswordResetToken) error
	GetPasswordResetToken(token string) (*PasswordResetToken, error)
	UsePasswordResetToken(token string) error

	// Session operations
	CreateSession(session *UserSession) error
	GetSessionByTokenHash(tokenHash string) (*UserSession, error)
	GetUserSessions(userID uuid.UUID) ([]UserSession, error)
	DeleteSession(tokenHash string) error
	DeleteSessionByID(sessionID uuid.UUID, userID uuid.UUID) error
	DeleteUserSessions(userID uuid.UUID) error
	CleanupExpiredTokens() error
}

// UserService handles user business logic
type UserService struct {
	repo UserRepository
}

// NewUserService creates a new user service
func NewUserService(repo UserRepository) *UserService {
	return &UserService{repo: repo}
}

// CreateUser creates a new user
func (s *UserService) CreateUser(user *User) error {
	return s.repo.CreateUser(user)
}

// GetUserByID retrieves a user by ID
func (s *UserService) GetUserByID(id uuid.UUID) (*User, error) {
	return s.repo.GetUserByID(id)
}

// GetUserByEmail retrieves a user by email
func (s *UserService) GetUserByEmail(email string) (*User, error) {
	return s.repo.GetUserByEmail(email)
}

// UpdateUser updates a user
func (s *UserService) UpdateUser(user *User) error {
	return s.repo.UpdateUser(user)
}

// VerifyUserEmail verifies a user's email
func (s *UserService) VerifyUserEmail(id uuid.UUID) error {
	return s.repo.VerifyUserEmail(id)
}

// UpdateLastLogin updates the user's last login time
func (s *UserService) UpdateLastLogin(id uuid.UUID) error {
	return s.repo.UpdateLastLogin(id)
}






































































