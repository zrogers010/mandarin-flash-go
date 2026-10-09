package helpers

import (
	"time"
)

// ValidateTimezone validates an IANA timezone name and returns it if valid, or "UTC" if invalid
func ValidateTimezone(tz string) string {
	if tz == "" {
		return "UTC"
	}
	
	_, err := time.LoadLocation(tz)
	if err != nil {
		return "UTC"
	}
	
	return tz
}

// GetLocalDate returns the current date in the given timezone as a time.Time at midnight UTC
func GetLocalDate(tz string) time.Time {
	loc, err := time.LoadLocation(tz)
	if err != nil {
		loc = time.UTC
	}
	
	now := time.Now().In(loc)
	// Return date at midnight UTC for storage
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
}
