package auth

import (
	"strings"
	"testing"
)

func TestValidatePasswordLength(t *testing.T) {
	if err := ValidatePasswordLength("short"); err == nil {
		t.Fatal("expected short password to fail")
	}
	if err := ValidatePasswordLength("long-enough"); err != nil {
		t.Fatalf("expected valid password, got %v", err)
	}
	if err := ValidatePasswordLength(strings.Repeat("a", MaxPasswordBytes+1)); err == nil {
		t.Fatal("expected 73-byte password to fail")
	}
	if err := ValidatePasswordLength(strings.Repeat("a", MaxPasswordBytes)); err != nil {
		t.Fatalf("72-byte password should pass: %v", err)
	}
}

func TestHashPasswordRejectsOverlong(t *testing.T) {
	_, err := HashPassword(strings.Repeat("x", 73))
	if err == nil {
		t.Fatal("expected HashPassword to reject >72 byte passwords instead of 500ing")
	}
}

func TestDummyPasswordHashIsUsable(t *testing.T) {
	if DummyPasswordHash == "" {
		t.Fatal("dummy hash should be generated at init")
	}
	if err := VerifyPassword("wrong", DummyPasswordHash); err == nil {
		t.Fatal("dummy hash should not match an arbitrary password")
	}
}

func TestHashTokenIsDeterministic(t *testing.T) {
	a := HashToken("reset-token")
	b := HashToken("reset-token")
	if a != b || len(a) != 64 {
		t.Fatalf("expected stable 64-char hex hash, got %q / %q", a, b)
	}
	if a == "reset-token" {
		t.Fatal("hash should not equal the raw token")
	}
}
