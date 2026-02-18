package main

import (
	"log"
	"os"
	"time"

	"chinese-learning/internal/api"
	"chinese-learning/internal/config"
	"chinese-learning/internal/database"
	"chinese-learning/internal/models"
	"chinese-learning/internal/redis"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// @title Chinese Learning API
// @version 1.0
// @description A comprehensive API for learning Chinese with HSK vocabulary, quizzes, and AI chat
// @host localhost:8080
// @BasePath /api/v1
func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize configuration
	cfg := config.Load()

	// Initialize database
	db, err := database.Connect(cfg.Database)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize Redis
	redisClient, err := redis.Connect(cfg.Redis)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()

	// Start background token cleanup
	userRepo := database.NewUserRepository(db)
	go startTokenCleanup(userRepo)

	// Set Gin mode
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create router
	router := gin.Default()

	// Configure Gin to handle trailing slashes
	router.RedirectTrailingSlash = false
	router.RedirectFixedPath = false

	// Add CORS middleware
	router.Use(gin.Recovery())

	// Initialize API routes
	api.SetupRoutes(router, db, redisClient, cfg)

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "chinese-learning-api",
		})
	})

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// startTokenCleanup runs periodic cleanup of expired tokens and sessions.
// Runs every hour to delete expired email verification tokens,
// password reset tokens, and user sessions.
func startTokenCleanup(repo models.UserRepository) {
	// Run an initial cleanup on startup (after a short delay)
	time.Sleep(10 * time.Second)
	if err := repo.CleanupExpiredTokens(); err != nil {
		log.Printf("Initial token cleanup failed: %v", err)
	} else {
		log.Println("Initial expired token cleanup completed")
	}

	// Then run every hour
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		if err := repo.CleanupExpiredTokens(); err != nil {
			log.Printf("Token cleanup failed: %v", err)
		} else {
			log.Println("Expired token cleanup completed")
		}
	}
}
