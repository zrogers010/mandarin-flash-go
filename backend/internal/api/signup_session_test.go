package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"chinese-learning/internal/config"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func signupSessionRouter(t *testing.T) *gin.Engine {
	t.Helper()
	db := setupTestDB(t)
	t.Cleanup(func() { _ = db.Close() })

	gin.SetMode(gin.TestMode)
	router := gin.New()
	SetupRoutes(router, db, nil, &config.Config{
		JWT: config.JWTConfig{Secret: "test-secret-key-for-signup-session-32b"},
		CORS: config.CORSConfig{
			AllowedOrigins: []string{"http://localhost:3000"},
		},
		FrontendURL: "http://localhost:3000",
	})
	return router
}

func TestSignupReturnsSessionAndProfile_Integration(t *testing.T) {
	router := signupSessionRouter(t)
	email := fmt.Sprintf("test-signup-session-%s@example.com", uuid.New().String())

	body, err := json.Marshal(map[string]string{
		"email":    email,
		"password": "StrongPass1!",
	})
	if err != nil {
		t.Fatal(err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/signup", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("signup status=%d body=%s", w.Code, w.Body.String())
	}

	var signupResp struct {
		Message            string `json:"message"`
		AccessToken        string `json:"access_token"`
		RefreshToken       string `json:"refresh_token"`
		ExpiresIn          int    `json:"expires_in"`
		OnboardingRequired bool   `json:"onboarding_required"`
		User               struct {
			ID         string `json:"id"`
			Email      string `json:"email"`
			IsVerified bool   `json:"is_verified"`
			IsActive   bool   `json:"is_active"`
		} `json:"user"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &signupResp); err != nil {
		t.Fatalf("decode signup: %v body=%s", err, w.Body.String())
	}
	if signupResp.AccessToken == "" || signupResp.RefreshToken == "" {
		t.Fatalf("signup did not return a session: %s", w.Body.String())
	}
	if signupResp.User.Email != email {
		t.Fatalf("signup user email=%q want %q", signupResp.User.Email, email)
	}
	if signupResp.User.IsVerified {
		t.Fatal("new signup should be unverified")
	}
	if !signupResp.OnboardingRequired {
		t.Fatal("expected onboarding_required")
	}

	meReq := httptest.NewRequest(http.MethodGet, "/api/v1/profile", nil)
	meReq.Header.Set("Authorization", "Bearer "+signupResp.AccessToken)
	meW := httptest.NewRecorder()
	router.ServeHTTP(meW, meReq)

	if meW.Code != http.StatusOK {
		t.Fatalf("profile status=%d body=%s", meW.Code, meW.Body.String())
	}

	var meResp struct {
		User struct {
			ID         string `json:"id"`
			Email      string `json:"email"`
			IsVerified bool   `json:"is_verified"`
		} `json:"user"`
	}
	if err := json.Unmarshal(meW.Body.Bytes(), &meResp); err != nil {
		t.Fatalf("decode profile: %v body=%s", err, meW.Body.String())
	}
	if meResp.User.ID != signupResp.User.ID || meResp.User.Email != email {
		t.Fatalf("profile user mismatch: %+v", meResp.User)
	}
	if meResp.User.IsVerified {
		t.Fatal("profile should still be unverified")
	}

	// Duplicate email must not mint a session (no user enumeration / account takeover).
	dupReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/signup", bytes.NewReader(body))
	dupReq.Header.Set("Content-Type", "application/json")
	dupW := httptest.NewRecorder()
	router.ServeHTTP(dupW, dupReq)
	if dupW.Code != http.StatusCreated {
		t.Fatalf("duplicate signup status=%d body=%s", dupW.Code, dupW.Body.String())
	}
	var dupResp map[string]any
	if err := json.Unmarshal(dupW.Body.Bytes(), &dupResp); err != nil {
		t.Fatal(err)
	}
	if _, ok := dupResp["access_token"]; ok {
		t.Fatalf("duplicate signup must not return access_token: %s", dupW.Body.String())
	}
}
