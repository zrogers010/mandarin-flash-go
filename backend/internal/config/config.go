package config

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application
type Config struct {
	Environment  string
	Database     DatabaseConfig
	Redis        RedisConfig
	JWT          JWTConfig
	CORS         CORSConfig
	Email        EmailConfig
	AI           AIConfig
	FrontendURL  string
}

// AIConfig holds AI service configuration (OpenAI-compatible API)
type AIConfig struct {
	APIKey    string
	BaseURL   string // OpenAI: https://api.openai.com/v1  (or any compatible endpoint)
	Model     string // e.g. "gpt-4o-mini", "gpt-4o", "claude-3-haiku-20240307"
	MaxTokens int
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Host     string
	Port     string
	Name     string
	User     string
	Password string
	SSLMode  string
}

// RedisConfig holds Redis configuration
type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

// JWTConfig holds JWT configuration
type JWTConfig struct {
	Secret string
}

// CORSConfig holds CORS configuration
type CORSConfig struct {
	AllowedOrigins []string
}

// EmailConfig holds email configuration
type EmailConfig struct {
	SendGridAPIKey string
	FromEmail      string
	FromName       string
	SupportEmail   string
}

// Load loads configuration from environment variables
func Load() *Config {
	// Load .env file from the backend directory
	_, b, _, _ := runtime.Caller(0)
	backendDir := filepath.Dir(b)
	envPath := filepath.Join(backendDir, "..", "..", ".env")

	// Try to load .env file, but don't fail if it doesn't exist
	if err := godotenv.Load(envPath); err != nil {
		// Try loading from current directory as fallback
		godotenv.Load()
	}

	env := getEnv("ENVIRONMENT", "development")

	// JWT secret handling: require a real secret in production
	jwtSecret := getEnv("JWT_SECRET", "")
	if jwtSecret == "" || jwtSecret == "your-secret-key" {
		if env == "production" {
			log.Fatal("FATAL: JWT_SECRET must be set to a strong random value in production. " +
				"Generate one with: openssl rand -hex 32")
		}
		// In development, generate a random secret if not set
		jwtSecret = generateDevSecret()
		log.Printf("⚠️  [DEV] No JWT_SECRET set — using auto-generated secret (sessions won't survive restarts)")
	}

	// DB password handling: warn in production if using defaults
	dbPassword := getEnv("DB_PASSWORD", "password")
	if env == "production" && dbPassword == "password" {
		log.Fatal("FATAL: DB_PASSWORD must be changed from default in production")
	}

	// Parse CORS origins
	corsOrigins := getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
	allowedOrigins := strings.Split(corsOrigins, ",")
	for i, origin := range allowedOrigins {
		allowedOrigins[i] = strings.TrimSpace(origin)
	}

	// DB SSL mode: require in production
	dbSSLMode := getEnv("DB_SSLMODE", "disable")
	if env == "production" && dbSSLMode == "disable" {
		log.Println("⚠️  WARNING: DB_SSLMODE is 'disable' in production. Consider using 'require' or 'verify-full'")
	}

	return &Config{
		Environment: env,
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			Name:     getEnv("DB_NAME", "chinese_learning"),
			User:     getEnv("DB_USER", "postgres"),
			Password: dbPassword,
			SSLMode:  dbSSLMode,
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       0,
		},
		JWT: JWTConfig{
			Secret: jwtSecret,
		},
		CORS: CORSConfig{
			AllowedOrigins: allowedOrigins,
		},
		Email: EmailConfig{
			SendGridAPIKey: getEnv("SENDGRID_API_KEY", ""),
			FromEmail:      getEnv("EMAIL_FROM", "noreply@mandarinflash.com"),
			FromName:       getEnv("EMAIL_FROM_NAME", "MandarinFlash"),
			SupportEmail:   getEnv("SUPPORT_EMAIL", "support@mandarinflash.com"),
		},
		AI: AIConfig{
			APIKey:    getEnv("AI_API_KEY", ""),
			BaseURL:   getEnv("AI_BASE_URL", "https://api.openai.com/v1"),
			Model:     getEnv("AI_MODEL", "gpt-4o-mini"),
			MaxTokens: 1024,
		},
	}
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// generateDevSecret generates a random secret for development use
func generateDevSecret() string {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "dev-fallback-secret-do-not-use-in-production"
	}
	return hex.EncodeToString(bytes)
}
