package api

import (
	"database/sql"
	"time"

	"chinese-learning/internal/auth"
	"chinese-learning/internal/config"
	"chinese-learning/internal/database"
	"chinese-learning/internal/middleware"
	"chinese-learning/internal/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// SetupRoutes configures all API routes
func SetupRoutes(router *gin.Engine, db *sql.DB, redisClient *redis.Client, cfg *config.Config) {
	// Add CORS middleware FIRST
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization", "Accept", "Cache-Control"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Initialize handlers
	vocabHandler := NewVocabularyHandler(db)
	quizHandler := NewQuizHandler(db)
	authHandler := NewAuthHandler(db, cfg)

	// Initialize middleware
	userRepo := database.NewUserRepository(db)
	userService := models.NewUserService(userRepo)
	tokenService := auth.NewTokenService(cfg)
	authMiddleware := middleware.NewAuthMiddleware(tokenService, userService)

	// API v1 group
	v1 := router.Group("/api/v1")
	{
		// Health check
		v1.GET("/health", healthCheck)

		// Authentication routes (public)
		auth := v1.Group("/auth")
		{
			auth.POST("/signup", authHandler.Signup)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)
			auth.POST("/request-password-reset", authHandler.RequestPasswordReset)
			auth.POST("/confirm-password-reset", authHandler.ConfirmPasswordReset)
			auth.POST("/verify-email", authHandler.VerifyEmail)
		}

		// Public content routes (no authentication required)
		// Vocabulary routes (public)
		vocabulary := v1.Group("/vocabulary")
		{
			vocabulary.GET("", vocabHandler.GetVocabularyList)  // Handle /vocabulary
			vocabulary.GET("/", vocabHandler.GetVocabularyList) // Handle /vocabulary/
			vocabulary.GET("/random", vocabHandler.GetRandomVocabulary)
			vocabulary.GET("/hsk/:level", vocabHandler.GetHSKVocabulary)
			vocabulary.GET("/:id", vocabHandler.GetVocabularyItem)
		}

		// Dictionary routes (public)
		dictionary := v1.Group("/dictionary")
		{
			dictionary.GET("/search", searchDictionary)
			dictionary.GET("/:word", getWordDefinition)
		}

		// Quiz routes (optional auth - can use without login, but tracks history if logged in)
		quiz := v1.Group("/quiz")
		quiz.Use(authMiddleware.OptionalAuth())
		{
			quiz.POST("/generate", quizHandler.GenerateQuiz)
			quiz.POST("/submit", quizHandler.SubmitQuiz)
		}

		// Protected routes (require authentication)
		protected := v1.Group("/")
		protected.Use(authMiddleware.RequireAuth())
		{
			// User profile routes
			profile := protected.Group("/profile")
			{
				profile.GET("", authHandler.GetProfile)
				profile.PUT("", authHandler.UpdateProfile)
			}

			// Quiz history (requires authentication to track)
			quizHistory := protected.Group("/quiz")
			{
				quizHistory.GET("/history", quizHandler.GetQuizHistory)
			}

			// Chat routes (protected)
			chat := protected.Group("/chat")
			{
				chat.POST("/message", sendChatMessage)
				chat.GET("/history", getChatHistory)
			}
		}
	}
}

// Health check endpoint
func healthCheck(c *gin.Context) {
	c.JSON(200, gin.H{
		"status":  "healthy",
		"service": "chinese-learning-api",
		"version": "1.0.0",
	})
}

// Dictionary endpoints
func searchDictionary(c *gin.Context) {
	query := c.Query("q")
	c.JSON(200, gin.H{
		"message": "Search dictionary endpoint - to be implemented",
		"query":   query,
	})
}

func getWordDefinition(c *gin.Context) {
	word := c.Param("word")
	c.JSON(200, gin.H{
		"message": "Get word definition endpoint - to be implemented",
		"word":    word,
	})
}

// Chat endpoints
func sendChatMessage(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "Send chat message endpoint - to be implemented",
	})
}

func getChatHistory(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "Get chat history endpoint - to be implemented",
	})
}
