package auth

import (
	"bytes"
	"context"
	"fmt"
	"html/template"
	"log"
	"time"

	"chinese-learning/internal/config"

	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/sesv2"
	sestypes "github.com/aws/aws-sdk-go-v2/service/sesv2/types"
)

// EmailService handles sending emails via AWS SES
type EmailService struct {
	sesClient    *sesv2.Client
	fromEmail    string
	fromName     string
	frontendURL  string
	supportEmail string
	enabled      bool
}

// NewEmailService creates a new email service using the application config.
// If AWS_REGION is not set, emails are logged to console (dev mode).
func NewEmailService(cfg *config.Config) *EmailService {
	es := &EmailService{
		fromEmail:    cfg.Email.FromEmail,
		fromName:     cfg.Email.FromName,
		frontendURL:  cfg.FrontendURL,
		supportEmail: cfg.Email.SupportEmail,
	}

	if cfg.Email.AWSRegion == "" {
		log.Println("[Email] No AWS_REGION set — running in dev mode (emails logged to console)")
		return es
	}

	awsCfg, err := awsconfig.LoadDefaultConfig(context.Background(),
		awsconfig.WithRegion(cfg.Email.AWSRegion),
	)
	if err != nil {
		log.Printf("[Email] WARNING: Failed to load AWS config: %v — falling back to dev mode", err)
		return es
	}

	es.sesClient = sesv2.NewFromConfig(awsCfg)
	es.enabled = true
	log.Printf("[Email] AWS SES enabled (region: %s)", cfg.Email.AWSRegion)
	return es
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

func (es *EmailService) sendEmail(toEmail, toName, subject, htmlBody string) error {
	if !es.enabled {
		log.Println("════════════════════════════════════════════════════════")
		log.Printf("  [DEV MODE] Email to: %s <%s>", toName, toEmail)
		log.Printf("  Subject: %s", subject)
		log.Println("  Set AWS_REGION to enable real email delivery via SES")
		log.Println("════════════════════════════════════════════════════════")
		return nil
	}

	fromAddr := fmt.Sprintf("%s <%s>", es.fromName, es.fromEmail)

	input := &sesv2.SendEmailInput{
		FromEmailAddress: &fromAddr,
		Destination: &sestypes.Destination{
			ToAddresses: []string{toEmail},
		},
		Content: &sestypes.EmailContent{
			Simple: &sestypes.Message{
				Subject: &sestypes.Content{Data: &subject},
				Body: &sestypes.Body{
					Html: &sestypes.Content{Data: &htmlBody},
				},
			},
		},
	}

	_, err := es.sesClient.SendEmail(context.Background(), input)
	if err != nil {
		return fmt.Errorf("SES SendEmail failed: %w", err)
	}

	log.Printf("Email sent successfully to: %s", toEmail)
	return nil
}

// SendEmailVerification sends an email verification email
func (es *EmailService) SendEmailVerification(email, name, token string) error {
	verifyURL := fmt.Sprintf("%s/verify-email?token=%s", es.frontendURL, token)

	if !es.enabled {
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

	if !es.enabled {
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
        .header { background: linear-gradient(135deg, #0d7377, #0ea5a5); padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .header h1 { color: white; margin: 0; }
        .content { padding: 20px; background: #ffffff; }
        .button { 
            display: inline-block; 
            background-color: #0d7377; 
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
            <h1>Welcome to MandarinFlash!</h1>
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
