package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"chinese-learning/internal/config"

	"github.com/gin-gonic/gin"
)

func newTestAuthHandler() *AuthHandler {
	return NewAuthHandler(nil, &config.Config{
		JWT:         config.JWTConfig{Secret: "test-secret-key-for-unit-tests-32b"},
		FrontendURL: "http://localhost:3000",
	})
}

func postAuthJSON(t *testing.T, handler gin.HandlerFunc, path string, body any) *httptest.ResponseRecorder {
	t.Helper()
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST(path, handler)

	raw, err := json.Marshal(body)
	if err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(raw))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestSignupRejectsOverlongPassword(t *testing.T) {
	h := newTestAuthHandler()
	w := postAuthJSON(t, h.Signup, "/signup", map[string]string{
		"email":    "new@example.com",
		"password": strings.Repeat("x", 73),
	})
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for 73-byte password, got %d body=%s", w.Code, w.Body.String())
	}
}

func TestLoginRejectsOverlongPassword(t *testing.T) {
	h := newTestAuthHandler()
	w := postAuthJSON(t, h.Login, "/login", map[string]string{
		"email":    "user@example.com",
		"password": strings.Repeat("x", 73),
	})
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for 73-byte password, got %d body=%s", w.Code, w.Body.String())
	}
}

func TestConfirmResetRejectsOverlongPassword(t *testing.T) {
	h := newTestAuthHandler()
	w := postAuthJSON(t, h.ConfirmPasswordReset, "/confirm", map[string]string{
		"token":    "not-a-real-token",
		"password": strings.Repeat("x", 73),
	})
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for 73-byte password, got %d body=%s", w.Code, w.Body.String())
	}
}
