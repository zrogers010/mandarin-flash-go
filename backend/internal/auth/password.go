package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

const (
	BcryptCost        = 12
	MinPasswordLength = 8
	MaxPasswordBytes  = 72 // bcrypt silently truncates past 72 bytes
)

// DummyPasswordHash is a real bcrypt hash used on unknown-email logins so
// the response time matches a valid user (no user-enumeration via timing).
var DummyPasswordHash string

func init() {
	hashed, err := bcrypt.GenerateFromPassword([]byte("not-a-real-password"), BcryptCost)
	if err != nil {
		panic("failed to generate dummy password hash: " + err.Error())
	}
	DummyPasswordHash = string(hashed)
}

// ValidatePasswordLength enforces bcrypt's 72-byte ceiling and the 8-char floor.
func ValidatePasswordLength(password string) error {
	if len(password) < MinPasswordLength {
		return fmt.Errorf("password must be at least %d characters", MinPasswordLength)
	}
	if len(password) > MaxPasswordBytes {
		return fmt.Errorf("password must be at most %d characters", MaxPasswordBytes)
	}
	return nil
}

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
	if err := ValidatePasswordLength(password); err != nil {
		return "", err
	}
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), BcryptCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}
	return string(hashedBytes), nil
}

// VerifyPassword verifies a password against its hash
func VerifyPassword(password, hashedPassword string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

// GenerateRandomToken generates a cryptographically secure random token
func GenerateRandomToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate random bytes: %w", err)
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

// GenerateSecureToken generates a secure token for email verification and password reset
func GenerateSecureToken() (string, error) {
	return GenerateRandomToken(32) // 32 bytes = 256 bits
}

// HashToken produces a deterministic SHA-256 hash of a token for database storage/lookup.
// This is used for refresh tokens and session tokens where we need to look up by hash.
func HashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}
