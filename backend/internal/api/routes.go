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
	// Add CORS middleware FIRST — use configured origins, never wildcard in production
	router.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORS.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization", "Accept", "Cache-Control"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Initialize handlers
	vocabHandler := NewVocabularyHandler(db)
	quizHandler := NewQuizHandler(db)
	dictHandler := NewDictionaryHandler(db)
	learningHandler := NewLearningHandler(db)
	chatHandler := NewChatHandler(db, cfg)
	authHandler := NewAuthHandler(db, cfg)
	ttsHandler := NewTTSHandler(cfg)

	// Initialize middleware
	userRepo := database.NewUserRepository(db)
	userService := models.NewUserService(userRepo)
	tokenService := auth.NewTokenService(cfg)
	authMiddleware := middleware.NewAuthMiddleware(tokenService, userService)
	rateLimiter := middleware.NewRateLimiter(redisClient)

	// API v1 group
	v1 := router.Group("/api/v1")
	{
		// Health check
		v1.GET("/health", healthCheck)

		// Authentication routes (public, rate-limited)
		authRoutes := v1.Group("/auth")
		{
			// Strict rate limits: 5 signup attempts per 15 min per IP
			authRoutes.POST("/signup",
				rateLimiter.Limit(5, 15*time.Minute, "signup"),
				authHandler.Signup,
			)
			// Strict rate limits: 10 login attempts per 15 min per IP
			authRoutes.POST("/login",
				rateLimiter.Limit(10, 15*time.Minute, "login"),
				authHandler.Login,
			)
			authRoutes.POST("/logout", authHandler.Logout)
			authRoutes.POST("/refresh", authHandler.RefreshToken)
			// Strict rate limits: 3 password reset requests per 15 min per IP
			authRoutes.POST("/request-password-reset",
				rateLimiter.Limit(3, 15*time.Minute, "password-reset-request"),
				authHandler.RequestPasswordReset,
			)
			// Strict rate limits: 5 password reset confirms per 15 min per IP
			authRoutes.POST("/confirm-password-reset",
				rateLimiter.Limit(5, 15*time.Minute, "password-reset-confirm"),
				authHandler.ConfirmPasswordReset,
			)
			authRoutes.POST("/verify-email", authHandler.VerifyEmail)
			// Resend verification email (rate-limited)
			authRoutes.POST("/resend-verification",
				rateLimiter.Limit(3, 15*time.Minute, "resend-verification"),
				authMiddleware.RequireAuth(),
				authHandler.ResendVerification,
			)
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

		// TTS route (public, rate-limited)
		v1.POST("/tts",
			rateLimiter.Limit(60, 1*time.Minute, "tts"),
			ttsHandler.Synthesize,
		)

		// Dictionary routes (public)
		dictionary := v1.Group("/dictionary")
		{
			dictionary.GET("/search", dictHandler.Search)
			dictionary.GET("/:word", dictHandler.GetWord)
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
			// User profile routes (work even without verified email)
			profile := protected.Group("/profile")
			{
				profile.GET("", authHandler.GetProfile)
				profile.PUT("", authHandler.UpdateProfile)
			}

			// Session management routes (work even without verified email)
			sessions := protected.Group("/sessions")
			{
				sessions.GET("", authHandler.GetSessions)
				sessions.DELETE("/:id", authHandler.RevokeSession)
			}

			// Quiz history & stats (requires authentication)
			quizProtected := protected.Group("/quiz")
			{
				quizProtected.GET("/history", quizHandler.GetQuizHistory)
				quizProtected.GET("/stats", quizHandler.GetQuizStats)
				quizProtected.GET("/:id", quizHandler.GetQuizDetail)
			}

			// --- Features that require verified email ---
			verified := protected.Group("/")
			verified.Use(authMiddleware.RequireVerified())
			{
				// Spaced repetition / learning routes
				learn := verified.Group("/learn")
				{
					learn.GET("/review", learningHandler.GetReviewItems)
					learn.POST("/review", learningHandler.SubmitReview)
					learn.GET("/new", learningHandler.GetNewWords)
					learn.GET("/stats", learningHandler.GetLearningStats)
				}

				// Chat routes
				chat := verified.Group("/chat")
				{
					chat.POST("/message", chatHandler.SendMessage)
					chat.GET("/history", chatHandler.GetHistory)
				}
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
