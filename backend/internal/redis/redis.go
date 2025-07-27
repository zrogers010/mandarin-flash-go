package redis

import (
	"context"
	"fmt"
	"log"

	"chinese-learning/internal/config"

	"github.com/redis/go-redis/v9"
)

// Connect establishes a connection to Redis
func Connect(cfg config.RedisConfig) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	// Test the connection
	ctx := context.Background()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to ping Redis: %w", err)
	}

	log.Println("✅ Connected to Redis")
	return client, nil
}

// Close closes the Redis connection
func Close(client *redis.Client) {
	if client != nil {
		client.Close()
		log.Println("🔌 Redis connection closed")
	}
}
