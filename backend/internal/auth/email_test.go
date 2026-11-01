package auth

import (
	"strings"
	"testing"
)

func TestVerificationEmailIsMultipartReady(t *testing.T) {
	html := GetVerificationEmailHTML("Ada", "tok123", "24")
	text := GetVerificationEmailPlainText("Ada", "tok123", "24")

	if !strings.Contains(html, "tok123") {
		t.Fatal("HTML verification email missing token")
	}
	if !strings.Contains(text, "tok123") {
		t.Fatal("plain-text verification email missing token")
	}
	if strings.Contains(text, "<html") {
		t.Fatal("plain-text template should not contain HTML")
	}
	if !strings.Contains(text, "Verify") && !strings.Contains(text, "verify") {
		t.Fatal("plain-text template should mention verification")
	}
}

func TestPasswordResetEmailIsMultipartReady(t *testing.T) {
	html := GetPasswordResetEmailHTML("Ada", "reset-tok")
	text := GetPasswordResetEmailPlainText("Ada", "reset-tok")

	if !strings.Contains(html, "reset-tok") || !strings.Contains(text, "reset-tok") {
		t.Fatal("reset email missing token")
	}
	if strings.Contains(text, "<html") {
		t.Fatal("plain-text reset email should not contain HTML")
	}
}

func TestWelcomeEmailHasPlainText(t *testing.T) {
	text := GetWelcomeEmailPlainText("Ada")
	if !strings.Contains(text, "Ada") {
		t.Fatal("welcome email missing name")
	}
	if strings.Contains(text, "<html") {
		t.Fatal("plain-text welcome email should not contain HTML")
	}
}
