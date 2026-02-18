package middleware

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// RateLimiter provides Redis-backed rate limiting
type RateLimiter struct {
	client *redis.Client
}

// NewRateLimiter creates a new rate limiter
func NewRateLimiter(client *redis.Client) *RateLimiter {
	return &RateLimiter{client: client}
}

// Limit returns a Gin middleware that enforces rate limiting.
// maxRequests is the maximum number of requests allowed in the given window.
// keyPrefix is used to namespace different rate limit buckets.
func (rl *RateLimiter) Limit(maxRequests int, window time.Duration, keyPrefix string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if rl.client == nil {
			// If Redis is unavailable, allow the request (fail open in dev)
			c.Next()
			return
		}

		ip := c.ClientIP()
		key := fmt.Sprintf("ratelimit:%s:%s", keyPrefix, ip)
		ctx := context.Background()

		// Increment the counter
		count, err := rl.client.Incr(ctx, key).Result()
		if err != nil {
			// Redis error — fail open so we don't block users
			c.Next()
			return
		}

		// Set expiry on first request in the window
		if count == 1 {
			rl.client.Expire(ctx, key, window)
		}

		// Check if over limit
		if count > int64(maxRequests) {
			ttl, _ := rl.client.TTL(ctx, key).Result()
			retryAfter := int(ttl.Seconds())
			if retryAfter <= 0 {
				retryAfter = int(window.Seconds())
			}

			c.Header("Retry-After", fmt.Sprintf("%d", retryAfter))
			c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", maxRequests))
			c.Header("X-RateLimit-Remaining", "0")
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Too many requests. Please try again later.",
				"retry_after": retryAfter,
			})
			c.Abort()
			return
		}

		remaining := int64(maxRequests) - count
		c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", maxRequests))
		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))
		c.Next()
	}
}
