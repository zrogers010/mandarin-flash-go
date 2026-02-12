package api

import (
	"database/sql"
	"net/http"
	"time"

	"chinese-learning/internal/auth"
	"chinese-learning/internal/config"
	"chinese-learning/internal/database"
	"chinese-learning/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AuthHandler handles authentication requests
type AuthHandler struct {
	userService  *models.UserService
	tokenService *auth.TokenService
	emailService *auth.EmailService
	userRepo     models.UserRepository
}

// NewAuthHandler creates a new authentication handler
func NewAuthHandler(db *sql.DB, cfg *config.Config) *AuthHandler {
	userRepo := database.NewUserRepository(db)
	userService := models.NewUserService(userRepo)
	tokenService := auth.NewTokenService(cfg)
	emailService := auth.NewEmailService()

	return &AuthHandler{
		userService:  userService,
		tokenService: tokenService,
		emailService: emailService,
		userRepo:     userRepo,
	}
}

// SignupRequest represents a signup request
type SignupRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// PasswordResetRequest represents a password reset request
type PasswordResetRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// PasswordResetConfirmRequest represents a password reset confirmation request
type PasswordResetConfirmRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=8"`
}

// EmailVerificationRequest represents an email verification request
type EmailVerificationRequest struct {
	Token string `json:"token" binding:"required"`
}

// RefreshTokenRequest represents a token refresh request
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// AuthResponse represents an authentication response
type AuthResponse struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	User         *models.User `json:"user"`
	ExpiresIn    int          `json:"expires_in"`
}

// Signup handles user registration
func (ah *AuthHandler) Signup(c *gin.Context) {
	var req SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Check if user already exists
	existingUser, err := ah.userService.GetUserByEmail(req.Email)
	if err == nil && existingUser != nil {
		c.JSON(http.StatusConflict, gin.H{
			"error": "User with this email already exists",
		})
		return
	}

	// Hash the password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process password",
		})
		return
	}

	// Create the user
	user := &models.User{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: hashedPassword,
		FirstName:    &req.FirstName,
		LastName:     &req.LastName,
		IsVerified:   false,
		IsActive:     true,
	}

	if err := ah.userService.CreateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create user",
		})
		return
	}

	// Generate email verification token
	verificationToken, err := auth.GenerateSecureToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate verification token",
		})
		return
	}

	// Store verification token
	emailToken := &models.EmailVerificationToken{
		ID:        uuid.New(),
		UserID:    user.ID,
		Token:     verificationToken,
		ExpiresAt: time.Now().Add(24 * time.Hour),
		CreatedAt: time.Now(),
	}

	if err := ah.userRepo.CreateEmailVerificationToken(emailToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create verification token",
		})
		return
	}

	// Send verification email
	name := req.FirstName
	if name == "" {
		name = "User"
	}
	if err := ah.emailService.SendEmailVerification(user.Email, name, verificationToken); err != nil {
		// Log error but don't fail the signup
		// In production, you might want to queue this for retry
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully. Please check your email for verification instructions.",
		"user": gin.H{
			"id":          user.ID,
			"email":       user.Email,
			"first_name":  user.FirstName,
			"last_name":   user.LastName,
			"is_verified": user.IsVerified,
		},
	})
}

// Login handles user authentication
func (ah *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Get user by email
	user, err := ah.userService.GetUserByEmail(req.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password",
		})
		return
	}

	// Check if user is active
	if !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Account is deactivated",
		})
		return
	}

	// Verify password
	if err := auth.VerifyPassword(req.Password, user.PasswordHash); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid email or password",
		})
		return
	}

	// Generate tokens
	accessToken, err := ah.tokenService.GenerateAccessToken(user.ID, user.Email, user.IsVerified)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate access token",
		})
		return
	}

	refreshToken, err := ah.tokenService.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate refresh token",
		})
		return
	}

	// Update last login
	if err := ah.userService.UpdateLastLogin(user.ID); err != nil {
		// Log error but don't fail the login
	}

	// Create session — store deterministic hash of refresh token for lookup
	clientIP := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	session := &models.UserSession{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenHash: auth.HashToken(refreshToken),
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
		IPAddress: &clientIP,
		UserAgent: &userAgent,
		CreatedAt: time.Now(),
	}

	if err := ah.userRepo.CreateSession(session); err != nil {
		// Log error but don't fail the login
	}

	c.JSON(http.StatusOK, AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
		ExpiresIn:    900, // 15 minutes
	})
}

// Logout handles user logout by invalidating the session
func (ah *AuthHandler) Logout(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}

	// Try to parse the body; if no body, try to invalidate based on auth header
	if err := c.ShouldBindJSON(&req); err == nil && req.RefreshToken != "" {
		// Delete session by token hash
		tokenHash := auth.HashToken(req.RefreshToken)
		if err := ah.userRepo.DeleteSession(tokenHash); err != nil {
			// Session may have already expired / been cleaned up — that's fine
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Logged out successfully",
	})
}

// RefreshToken handles token refresh — exchanges a valid refresh token for a new access token
func (ah *AuthHandler) RefreshToken(c *gin.Context) {
	var req RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Validate the refresh token JWT
	claims, err := ah.tokenService.ValidateToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Invalid or expired refresh token",
		})
		return
	}

	// Look up the session in the database
	tokenHash := auth.HashToken(req.RefreshToken)
	session, err := ah.userRepo.GetSessionByTokenHash(tokenHash)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Session not found — please log in again",
		})
		return
	}

	// Check if session is expired
	if time.Now().After(session.ExpiresAt) {
		// Clean up the expired session
		_ = ah.userRepo.DeleteSession(tokenHash)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Session expired — please log in again",
		})
		return
	}

	// Get the user
	user, err := ah.userService.GetUserByID(claims.UserID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not found",
		})
		return
	}

	// Check if user is still active
	if !user.IsActive {
		_ = ah.userRepo.DeleteSession(tokenHash)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "Account is deactivated",
		})
		return
	}

	// Generate a new access token
	newAccessToken, err := ah.tokenService.GenerateAccessToken(user.ID, user.Email, user.IsVerified)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate access token",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": newAccessToken,
		"expires_in":   900, // 15 minutes
	})
}

// RequestPasswordReset handles password reset requests
func (ah *AuthHandler) RequestPasswordReset(c *gin.Context) {
	var req PasswordResetRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Get user by email
	user, err := ah.userService.GetUserByEmail(req.Email)
	if err != nil {
		// Don't reveal if user exists or not for security
		c.JSON(http.StatusOK, gin.H{
			"message": "If an account with that email exists, a password reset link has been sent.",
		})
		return
	}

	// Check if user is active
	if !user.IsActive {
		c.JSON(http.StatusOK, gin.H{
			"message": "If an account with that email exists, a password reset link has been sent.",
		})
		return
	}

	// Generate password reset token
	resetToken, err := auth.GenerateSecureToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate reset token",
		})
		return
	}

	// Store reset token
	passwordToken := &models.PasswordResetToken{
		ID:        uuid.New(),
		UserID:    user.ID,
		Token:     resetToken,
		ExpiresAt: time.Now().Add(1 * time.Hour), // Token expires in 1 hour
		CreatedAt: time.Now(),
	}

	if err := ah.userRepo.CreatePasswordResetToken(passwordToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create reset token",
		})
		return
	}

	// Send password reset email
	name := "User"
	if user.FirstName != nil {
		name = *user.FirstName
	}
	if err := ah.emailService.SendPasswordReset(user.Email, name, resetToken); err != nil {
		// Log error but don't fail the request
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "If an account with that email exists, a password reset link has been sent.",
	})
}

// ConfirmPasswordReset handles password reset confirmation
func (ah *AuthHandler) ConfirmPasswordReset(c *gin.Context) {
	var req PasswordResetConfirmRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Get the reset token
	resetToken, err := ah.userRepo.GetPasswordResetToken(req.Token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid or expired reset token",
		})
		return
	}

	// Check if token is expired
	if time.Now().After(resetToken.ExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Reset token has expired",
		})
		return
	}

	// Check if token has been used
	if resetToken.UsedAt != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Reset token has already been used",
		})
		return
	}

	// Get the user
	user, err := ah.userService.GetUserByID(resetToken.UserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "User not found",
		})
		return
	}

	// Hash the new password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to process password",
		})
		return
	}

	// Update user password
	user.PasswordHash = hashedPassword
	if err := ah.userService.UpdateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update password",
		})
		return
	}

	// Mark token as used
	if err := ah.userRepo.UsePasswordResetToken(req.Token); err != nil {
		// Log error but don't fail the request
	}

	// Invalidate all user sessions for security
	if err := ah.userRepo.DeleteUserSessions(user.ID); err != nil {
		// Log error but don't fail the request
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password has been reset successfully",
	})
}

// VerifyEmail handles email verification
func (ah *AuthHandler) VerifyEmail(c *gin.Context) {
	var req EmailVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Get the verification token
	verificationToken, err := ah.userRepo.GetEmailVerificationToken(req.Token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid or expired verification token",
		})
		return
	}

	// Check if token is expired
	if time.Now().After(verificationToken.ExpiresAt) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Verification token has expired",
		})
		return
	}

	// Check if token has been used
	if verificationToken.UsedAt != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Email has already been verified",
		})
		return
	}

	// Verify the user's email
	if err := ah.userService.VerifyUserEmail(verificationToken.UserID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to verify email",
		})
		return
	}

	// Mark token as used
	if err := ah.userRepo.UseEmailVerificationToken(req.Token); err != nil {
		// Log error but don't fail the request
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Email has been verified successfully",
	})
}

// GetProfile returns the current user's profile
func (ah *AuthHandler) GetProfile(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}

// UpdateProfile updates the current user's profile
func (ah *AuthHandler) UpdateProfile(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	currentUser := user.(*models.User)

	var req struct {
		FirstName *string `json:"first_name"`
		LastName  *string `json:"last_name"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request data",
			"details": err.Error(),
		})
		return
	}

	// Update user fields
	if req.FirstName != nil {
		currentUser.FirstName = req.FirstName
	}
	if req.LastName != nil {
		currentUser.LastName = req.LastName
	}

	if err := ah.userService.UpdateUser(currentUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update profile",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user":    currentUser,
	})
}
