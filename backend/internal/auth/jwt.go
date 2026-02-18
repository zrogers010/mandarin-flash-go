package auth

import (
	"fmt"
	"time"

	"chinese-learning/internal/config"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// JWTClaims represents the claims in a JWT token
type JWTClaims struct {
	UserID     uuid.UUID `json:"user_id"`
	Email      string    `json:"email"`
	IsVerified bool      `json:"is_verified"`
	jwt.RegisteredClaims
}

// TokenService handles JWT token operations
type TokenService struct {
	secretKey []byte
	issuer    string
}

// NewTokenService creates a new token service
func NewTokenService(cfg *config.Config) *TokenService {
	return &TokenService{
		secretKey: []byte(cfg.JWT.Secret),
		issuer:    "chinese-learning-api",
	}
}

// GenerateAccessToken generates a JWT access token
func (ts *TokenService) GenerateAccessToken(userID uuid.UUID, email string, isVerified bool) (string, error) {
	now := time.Now()
	claims := JWTClaims{
		UserID:     userID,
		Email:      email,
		IsVerified: isVerified,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    ts.issuer,
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(15 * time.Minute)), // Short-lived access token
			NotBefore: jwt.NewNumericDate(now),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(ts.secretKey)
}

// GenerateRefreshToken generates a JWT refresh token
func (ts *TokenService) GenerateRefreshToken(userID uuid.UUID) (string, error) {
	now := time.Now()
	claims := JWTClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    ts.issuer,
			Subject:   userID.String(),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(7 * 24 * time.Hour)), // Long-lived refresh token
			NotBefore: jwt.NewNumericDate(now),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(ts.secretKey)
}

// ValidateToken validates and parses a JWT token
func (ts *TokenService) ValidateToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return ts.secretKey, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// ExtractTokenFromHeader extracts the token from the Authorization header
func ExtractTokenFromHeader(authHeader string) (string, error) {
	if authHeader == "" {
		return "", fmt.Errorf("authorization header is empty")
	}

	// Check if it starts with "Bearer "
	if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
		return "", fmt.Errorf("invalid authorization header format")
	}

	return authHeader[7:], nil
}






































































