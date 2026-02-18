package auth

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"time"

	"chinese-learning/internal/config"
)

// EmailService handles sending emails
type EmailService struct {
	sendGridAPIKey string
	fromEmail      string
	fromName       string
	frontendURL    string
	supportEmail   string
}

// NewEmailService creates a new email service using the application config
func NewEmailService(cfg *config.Config) *EmailService {
	return &EmailService{
		sendGridAPIKey: cfg.Email.SendGridAPIKey,
		fromEmail:      cfg.Email.FromEmail,
		fromName:       cfg.Email.FromName,
		frontendURL:    cfg.FrontendURL,
		supportEmail:   cfg.Email.SupportEmail,
	}
}

// EmailTemplate represents an email template
type EmailTemplate struct {
	Subject string
	Body    string
}

// EmailVerificationData represents data for email verification
type EmailVerificationData struct {
	UserName     string
	VerifyURL    string
	ExpiresAt    time.Time
	SupportEmail string
}

// PasswordResetData represents data for password reset
type PasswordResetData struct {
	UserName     string
	ResetURL     string
	ExpiresAt    time.Time
	SupportEmail string
}

// sendGridEmail represents the SendGrid API v3 email payload
type sendGridEmail struct {
	Personalizations []sendGridPersonalization `json:"personalizations"`
	From             sendGridAddress           `json:"from"`
	Subject          string                    `json:"subject"`
	Content          []sendGridContent         `json:"content"`
}

type sendGridPersonalization struct {
	To []sendGridAddress `json:"to"`
}

type sendGridAddress struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

type sendGridContent struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

// sendEmail sends an email using SendGrid API v3 or falls back to logging
func (es *EmailService) sendEmail(toEmail, toName, subject, htmlBody string) error {
	// If no SendGrid API key is configured, fall back to logging (dev mode)
	if es.sendGridAPIKey == "" {
		log.Println("════════════════════════════════════════════════════════")
		log.Printf("  [DEV MODE] Email to: %s <%s>", toName, toEmail)
		log.Printf("  Subject: %s", subject)
		log.Println("  Set SENDGRID_API_KEY env var to enable real email delivery")
		log.Println("════════════════════════════════════════════════════════")
		return nil
	}

	// Build SendGrid API v3 payload
	payload := sendGridEmail{
		Personalizations: []sendGridPersonalization{
			{
				To: []sendGridAddress{
					{Email: toEmail, Name: toName},
				},
			},
		},
		From:    sendGridAddress{Email: es.fromEmail, Name: es.fromName},
		Subject: subject,
		Content: []sendGridContent{
			{Type: "text/html", Value: htmlBody},
		},
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal email payload: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.sendgrid.com/v3/mail/send", bytes.NewBuffer(jsonPayload))
	if err != nil {
		return fmt.Errorf("failed to create email request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+es.sendGridAPIKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}
	defer resp.Body.Close()

	// SendGrid returns 202 Accepted on success
	if resp.StatusCode != http.StatusAccepted && resp.StatusCode != http.StatusOK {
		return fmt.Errorf("SendGrid API returned status %d", resp.StatusCode)
	}

	log.Printf("📧 Email sent successfully to: %s", toEmail)
	return nil
}

// SendEmailVerification sends an email verification email
func (es *EmailService) SendEmailVerification(email, name, token string) error {
	verifyURL := fmt.Sprintf("%s/verify-email?token=%s", es.frontendURL, token)

	// In dev mode, log the verification URL directly for convenience
	if es.sendGridAPIKey == "" {
		log.Println("════════════════════════════════════════════════════════")
		log.Printf("  [DEV] Email verification for: %s", email)
		log.Printf("  Verify URL: %s", verifyURL)
		log.Println("════════════════════════════════════════════════════════")
		return nil
	}

	data := EmailVerificationData{
		UserName:     name,
		VerifyURL:    verifyURL,
		ExpiresAt:    time.Now().Add(24 * time.Hour),
		SupportEmail: es.supportEmail,
	}

	emailTemplate, err := es.getEmailVerificationTemplate()
	if err != nil {
		return fmt.Errorf("failed to get email template: %w", err)
	}

	emailBody, err := es.renderTemplate(emailTemplate, data)
	if err != nil {
		return fmt.Errorf("failed to render email template: %w", err)
	}

	return es.sendEmail(email, name, emailTemplate.Subject, emailBody)
}

// SendPasswordReset sends a password reset email
func (es *EmailService) SendPasswordReset(email, name, token string) error {
	resetURL := fmt.Sprintf("%s/reset-password?token=%s", es.frontendURL, token)

	// In dev mode, log the reset URL directly for convenience
	if es.sendGridAPIKey == "" {
		log.Println("════════════════════════════════════════════════════════")
		log.Printf("  [DEV] Password reset for: %s", email)
		log.Printf("  Reset URL: %s", resetURL)
		log.Println("════════════════════════════════════════════════════════")
		return nil
	}

	data := PasswordResetData{
		UserName:     name,
		ResetURL:     resetURL,
		ExpiresAt:    time.Now().Add(1 * time.Hour),
		SupportEmail: es.supportEmail,
	}

	emailTemplate, err := es.getPasswordResetTemplate()
	if err != nil {
		return fmt.Errorf("failed to get email template: %w", err)
	}

	emailBody, err := es.renderTemplate(emailTemplate, data)
	if err != nil {
		return fmt.Errorf("failed to render email template: %w", err)
	}

	return es.sendEmail(email, name, emailTemplate.Subject, emailBody)
}

// getEmailVerificationTemplate returns the email verification template
func (es *EmailService) getEmailVerificationTemplate() (*EmailTemplate, error) {
	subject := "Verify Your Email - MandarinFlash"

	body := `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verify Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9, #eab308); padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { padding: 20px; background: #ffffff; }
        .button { 
            display: inline-block; 
            background-color: #0ea5e9; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
            font-weight: bold;
        }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to MandarinFlash! 🎯</h1>
        </div>
        <div class="content">
            <p>Hello {{.UserName}},</p>
            <p>Thank you for signing up for MandarinFlash. To complete your registration, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
                <a href="{{.VerifyURL}}" class="button">Verify Email Address</a>
            </p>
            <p>This verification link will expire on {{.ExpiresAt.Format "January 2, 2006 at 3:04 PM MST"}}.</p>
            <p>If you didn't create an account with us, please ignore this email.</p>
            <p>Best regards,<br>The MandarinFlash Team</p>
        </div>
        <div class="footer">
            <p>If you're having trouble clicking the button, copy and paste the URL below into your web browser:</p>
            <p>{{.VerifyURL}}</p>
            <p>Need help? Contact us at {{.SupportEmail}}</p>
        </div>
    </div>
</body>
</html>`

	return &EmailTemplate{
		Subject: subject,
		Body:    body,
	}, nil
}

// getPasswordResetTemplate returns the password reset template
func (es *EmailService) getPasswordResetTemplate() (*EmailTemplate, error) {
	subject := "Reset Your Password - MandarinFlash"

	body := `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545, #ff6b6b); padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { padding: 20px; background: #ffffff; }
        .button { 
            display: inline-block; 
            background-color: #dc3545; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
            font-weight: bold;
        }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hello {{.UserName}},</p>
            <p>We received a request to reset your password for your MandarinFlash account. Click the button below to reset your password:</p>
            <p style="text-align: center;">
                <a href="{{.ResetURL}}" class="button">Reset Password</a>
            </p>
            <p>This password reset link will expire on {{.ExpiresAt.Format "January 2, 2006 at 3:04 PM MST"}}.</p>
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            <p>Best regards,<br>The MandarinFlash Team</p>
        </div>
        <div class="footer">
            <p>If you're having trouble clicking the button, copy and paste the URL below into your web browser:</p>
            <p>{{.ResetURL}}</p>
            <p>Need help? Contact us at {{.SupportEmail}}</p>
        </div>
    </div>
</body>
</html>`

	return &EmailTemplate{
		Subject: subject,
		Body:    body,
	}, nil
}

// renderTemplate renders an email template with the given data
func (es *EmailService) renderTemplate(emailTpl *EmailTemplate, data interface{}) (string, error) {
	tmpl, err := template.New("email").Parse(emailTpl.Body)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}
