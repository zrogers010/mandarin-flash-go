package auth

import (
	"fmt"
	"time"
)

// Email template functions for transactional emails

// GetVerificationEmailHTML returns the HTML version of verification email
func GetVerificationEmailHTML(displayName, token, expiryHours string) string {
	verifyURL := fmt.Sprintf("https://mandarinflash.com/verify-email?token=%s", token)
	
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - MandarinFlash</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%%, #14b8a6 100%%); padding: 40px 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">MandarinFlash</h1>
                            <p style="margin: 10px 0 0; color: #d1fae5; font-size: 16px;">学习中文 | Learn Chinese</p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">Hi %s!</h2>
                            <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Welcome to MandarinFlash! To get started with spaced repetition review and unlock all features, please verify your email address.
                            </p>
                            
                            <!-- CTA Button -->
                            <table cellpadding="0" cellspacing="0" width="100%%" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="%s" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600;">Verify Email Address</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                Or copy and paste this link into your browser:<br>
                                <a href="%s" style="color: #10b981; word-break: break-all;">%s</a>
                            </p>
                            
                            <p style="margin: 20px 0 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                                This link expires in %s hours. If you didn't create an account, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px;">
                                MandarinFlash • Free HSK Vocabulary & Spaced Repetition
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                Questions? Email us at <a href="mailto:support@mandarinflash.com" style="color: #10b981; text-decoration: none;">support@mandarinflash.com</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`, displayName, verifyURL, verifyURL, verifyURL, expiryHours)
}

// GetVerificationEmailPlainText returns the plain text version
func GetVerificationEmailPlainText(displayName, token, expiryHours string) string {
	verifyURL := fmt.Sprintf("https://mandarinflash.com/verify-email?token=%s", token)
	
	return fmt.Sprintf(`Hi %s!

Welcome to MandarinFlash! To get started with spaced repetition review and unlock all features, please verify your email address.

Verify your email address:
%s

This link expires in %s hours. If you didn't create an account, you can safely ignore this email.

---
MandarinFlash
Free HSK Vocabulary & Spaced Repetition
https://mandarinflash.com

Questions? Email us at support@mandarinflash.com
`, displayName, verifyURL, expiryHours)
}

// GetPasswordResetEmailHTML returns the HTML version of password reset email
func GetPasswordResetEmailHTML(displayName, token string) string {
	resetURL := fmt.Sprintf("https://mandarinflash.com/reset-password?token=%s", token)
	
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - MandarinFlash</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%%, #14b8a6 100%%); padding: 40px 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">MandarinFlash</h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
                            <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Hi %s, we received a request to reset your password. Click the button below to create a new password.
                            </p>
                            
                            <!-- CTA Button -->
                            <table cellpadding="0" cellspacing="0" width="100%%" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="%s" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600;">Reset Password</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                Or copy and paste this link into your browser:<br>
                                <a href="%s" style="color: #10b981; word-break: break-all;">%s</a>
                            </p>
                            
                            <p style="margin: 20px 0 0; color: #9ca3af; font-size: 13px; line-height: 1.5;">
                                This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px;">
                                MandarinFlash • Free HSK Vocabulary & Spaced Repetition
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                Questions? Email us at <a href="mailto:support@mandarinflash.com" style="color: #10b981; text-decoration: none;">support@mandarinflash.com</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`, displayName, resetURL, resetURL, resetURL)
}

// GetPasswordResetEmailPlainText returns the plain text version
func GetPasswordResetEmailPlainText(displayName, token string) string {
	resetURL := fmt.Sprintf("https://mandarinflash.com/reset-password?token=%s", token)
	
	return fmt.Sprintf(`Hi %s,

We received a request to reset your password. Click the link below to create a new password:

%s

This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.

---
MandarinFlash
Free HSK Vocabulary & Spaced Repetition
https://mandarinflash.com

Questions? Email us at support@mandarinflash.com
`, displayName, resetURL)
}

// GetWelcomeEmailHTML returns the HTML version of welcome email (sent after verification)
func GetWelcomeEmailHTML(displayName string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to MandarinFlash!</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%%, #14b8a6 100%%); padding: 40px; text-align: center;">
                            <h1 style="margin: 0 0 10px; color: #ffffff; font-size: 32px; font-weight: 700;">🎉 Welcome!</h1>
                            <p style="margin: 0; color: #d1fae5; font-size: 18px;">You're ready to start learning Chinese</p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; color: #111827; font-size: 18px; line-height: 1.6;">
                                Hi %s! Your email is now verified.
                            </p>
                            <p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                MandarinFlash uses spaced repetition to help you remember Chinese vocabulary long-term. Here's what you can do:
                            </p>
                            
                            <ul style="margin: 20px 0; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
                                <li>Study 2,500 HSK words with pinyin, tones & examples</li>
                                <li>Practice with flashcards and quizzes</li>
                                <li>Build a daily streak with spaced repetition</li>
                                <li>Track your progress and set daily goals</li>
                            </ul>
                            
                            <!-- CTA Button -->
                            <table cellpadding="0" cellspacing="0" width="100%%" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="https://mandarinflash.com/dashboard" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600;">Start Learning</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                <strong>Pro tip:</strong> Consistency beats intensity. Even 10 minutes a day will get you fluent!
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px; color: #6b7280; font-size: 13px;">
                                MandarinFlash • Free HSK Vocabulary & Spaced Repetition
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                Questions? Email us at <a href="mailto:support@mandarinflash.com" style="color: #10b981; text-decoration: none;">support@mandarinflash.com</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`, displayName)
}

// GetWelcomeEmailPlainText returns the plain text version
func GetWelcomeEmailPlainText(displayName string) string {
	return fmt.Sprintf(`Hi %s! Your email is now verified. 🎉

MandarinFlash uses spaced repetition to help you remember Chinese vocabulary long-term. Here's what you can do:

• Study 2,500 HSK words with pinyin, tones & examples
• Practice with flashcards and quizzes
• Build a daily streak with spaced repetition
• Track your progress and set daily goals

Start learning: https://mandarinflash.com/dashboard

Pro tip: Consistency beats intensity. Even 10 minutes a day will get you fluent!

---
MandarinFlash
Free HSK Vocabulary & Spaced Repetition
https://mandarinflash.com

Questions? Email us at support@mandarinflash.com
`, displayName)
}

// FormatExpiryHours converts time.Duration to hours string
func FormatExpiryHours(d time.Duration) string {
	hours := int(d.Hours())
	if hours == 1 {
		return "1"
	}
	return fmt.Sprintf("%d", hours)
}
