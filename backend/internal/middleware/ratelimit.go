package middleware

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"chinese-learning/internal/models"

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

// Limit returns a Gin middleware that enforces per-IP rate limiting.
// Redis-down behavior is fail-open so login/signup still work if Redis dies.
func (rl *RateLimiter) Limit(maxRequests int, window time.Duration, keyPrefix string) gin.HandlerFunc {
	return rl.limit(maxRequests, window, keyPrefix, func(c *gin.Context) string {
		return c.ClientIP()
	}, false)
}

// LimitEmail rate-limits by JSON body email (normalized). Used for password reset.
// failClosed: when Redis is down, reject the request (prevents inbox bombing).
func (rl *RateLimiter) LimitEmail(maxRequests int, window time.Duration, keyPrefix string, failClosed bool) gin.HandlerFunc {
	return rl.limit(maxRequests, window, keyPrefix, emailFromJSONBody, failClosed)
}

// LimitAuthEmail rate-limits by the authenticated user's email.
func (rl *RateLimiter) LimitAuthEmail(maxRequests int, window time.Duration, keyPrefix string, failClosed bool) gin.HandlerFunc {
	return rl.limit(maxRequests, window, keyPrefix, emailFromAuthContext, failClosed)
}

func emailFromJSONBody(c *gin.Context) string {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		return c.ClientIP()
	}
	c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

	var payload struct {
		Email string `json:"email"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return c.ClientIP()
	}
	email := strings.ToLower(strings.TrimSpace(payload.Email))
	if email == "" {
		return c.ClientIP()
	}
	return email
}

func emailFromAuthContext(c *gin.Context) string {
	if raw, ok := c.Get("user"); ok {
		if user, ok := raw.(*models.User); ok && user != nil && user.Email != "" {
			return strings.ToLower(strings.TrimSpace(user.Email))
		}
	}
	return c.ClientIP()
}

func (rl *RateLimiter) limit(
	maxRequests int,
	window time.Duration,
	keyPrefix string,
	keyFn func(*gin.Context) string,
	failClosed bool,
) gin.HandlerFunc {
	return func(c *gin.Context) {
		if rl.client == nil {
			if failClosed {
				c.JSON(http.StatusServiceUnavailable, gin.H{
					"error": "Service temporarily unavailable. Please try again later.",
				})
				c.Abort()
				return
			}
			c.Next()
			return
		}

		bucket := keyFn(c)
		key := fmt.Sprintf("ratelimit:%s:%s", keyPrefix, bucket)
		ctx := context.Background()

		count, err := rl.client.Incr(ctx, key).Result()
		if err != nil {
			if failClosed {
				c.JSON(http.StatusServiceUnavailable, gin.H{
					"error": "Service temporarily unavailable. Please try again later.",
				})
				c.Abort()
				return
			}
			c.Next()
			return
		}

		if count == 1 {
			rl.client.Expire(ctx, key, window)
		}

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
