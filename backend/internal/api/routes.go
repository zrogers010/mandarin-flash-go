package api

import (
	"database/sql"
	"time"

	"chinese-learning/internal/config"

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

	// API v1 group
	v1 := router.Group("/api/v1")
	{
		// Health check
		v1.GET("/health", healthCheck)

		// Vocabulary routes
		vocabulary := v1.Group("/vocabulary")
		{
			vocabulary.GET("", vocabHandler.GetVocabularyList)  // Handle /vocabulary
			vocabulary.GET("/", vocabHandler.GetVocabularyList) // Handle /vocabulary/
			vocabulary.GET("/random", vocabHandler.GetRandomVocabulary)
			vocabulary.GET("/hsk/:level", vocabHandler.GetHSKVocabulary)
			vocabulary.GET("/:id", vocabHandler.GetVocabularyItem)
		}

		// Quiz routes
		quiz := v1.Group("/quiz")
		{
			quiz.GET("/generate", generateQuiz)
			quiz.POST("/submit", submitQuiz)
			quiz.GET("/history", getQuizHistory)
		}

		// Dictionary routes
		dictionary := v1.Group("/dictionary")
		{
			dictionary.GET("/search", searchDictionary)
			dictionary.GET("/:word", getWordDefinition)
		}

		// Chat routes
		chat := v1.Group("/chat")
		{
			chat.POST("/message", sendChatMessage)
			chat.GET("/history", getChatHistory)
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

// Quiz endpoints
func generateQuiz(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "Generate quiz endpoint - to be implemented",
	})
}

func submitQuiz(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "Submit quiz endpoint - to be implemented",
	})
}

func getQuizHistory(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "Get quiz history endpoint - to be implemented",
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
