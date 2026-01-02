package middleware

import (
	"net/http"

	"chinese-learning/internal/auth"
	"chinese-learning/internal/models"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware handles authentication middleware
type AuthMiddleware struct {
	tokenService *auth.TokenService
	userService  *models.UserService
}

// NewAuthMiddleware creates a new authentication middleware
func NewAuthMiddleware(tokenService *auth.TokenService, userService *models.UserService) *AuthMiddleware {
	return &AuthMiddleware{
		tokenService: tokenService,
		userService:  userService,
	}
}

// RequireAuth is a middleware that requires authentication
func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Authorization header is required",
			})
			c.Abort()
			return
		}

		tokenString, err := auth.ExtractTokenFromHeader(authHeader)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid authorization header",
			})
			c.Abort()
			return
		}

		claims, err := m.tokenService.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			c.Abort()
			return
		}

		// Get user from database
		user, err := m.userService.GetUserByID(claims.UserID)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "User not found",
			})
			c.Abort()
			return
		}

		// Set user in context
		c.Set("user", user)
		c.Set("user_id", claims.UserID)
		c.Next()
	}
}

// OptionalAuth is a middleware that optionally authenticates the user
// If a valid token is provided, the user is set in context
// If no token or invalid token, the request continues without user
func (m *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		tokenString, err := auth.ExtractTokenFromHeader(authHeader)
		if err != nil {
			c.Next()
			return
		}

		claims, err := m.tokenService.ValidateToken(tokenString)
		if err != nil {
			c.Next()
			return
		}

		// Get user from database
		user, err := m.userService.GetUserByID(claims.UserID)
		if err != nil {
			c.Next()
			return
		}

		// Set user in context if authentication succeeded
		c.Set("user", user)
		c.Set("user_id", claims.UserID)
		c.Next()
	}
}

