package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestLimitEmailFailClosedWithoutRedis(t *testing.T) {
	gin.SetMode(gin.TestMode)
	rl := NewRateLimiter(nil)

	r := gin.New()
	r.POST("/reset", rl.LimitEmail(3, time.Minute, "password-reset-email", true), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/reset", strings.NewReader(`{"email":"a@b.com"}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 when Redis is down on a fail-closed email limit, got %d", w.Code)
	}
}

func TestLimitIPFailOpenWithoutRedis(t *testing.T) {
	gin.SetMode(gin.TestMode)
	rl := NewRateLimiter(nil)

	r := gin.New()
	r.POST("/login", rl.Limit(10, time.Minute, "login"), func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/login", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected login to fail-open without Redis, got %d", w.Code)
	}
}

func TestEmailFromJSONBodyNormalizes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	c.Request = httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"email":"  Ada@Example.COM "}`))
	if got := emailFromJSONBody(c); got != "ada@example.com" {
		t.Fatalf("got %q", got)
	}
}
