package services

import (
	"errors"
	"net/url"
	"regexp"
	"strings"
)

type Platform string

const (
	PlatformYouTube   Platform = "youtube"
	PlatformInstagram Platform = "instagram"
	PlatformTikTok    Platform = "tiktok"
	PlatformUnknown   Platform = "unknown"
)

var (
	ErrInvalidURL      = errors.New("invalid URL")
	ErrUnsupportedURL  = errors.New("unsupported platform")
	ErrDurationTooLong = errors.New("video duration exceeds maximum allowed")
)

var platformPatterns = map[Platform]*regexp.Regexp{
	PlatformYouTube:   regexp.MustCompile(`(?i)(youtube\.com|youtu\.be|music\.youtube\.com)`),
	PlatformInstagram: regexp.MustCompile(`(?i)(instagram\.com|instagr\.am)`),
	PlatformTikTok:    regexp.MustCompile(`(?i)(tiktok\.com|vm\.tiktok\.com)`),
}

type Validator struct {
	maxDuration int
}

func NewValidator(maxDuration int) *Validator {
	return &Validator{
		maxDuration: maxDuration,
	}
}

func (v *Validator) ValidateURL(rawURL string) (Platform, error) {
	rawURL = strings.TrimSpace(rawURL)
	
	parsed, err := url.Parse(rawURL)
	if err != nil || parsed.Host == "" {
		return PlatformUnknown, ErrInvalidURL
	}

	for platform, pattern := range platformPatterns {
		if pattern.MatchString(parsed.Host) {
			return platform, nil
		}
	}

	return PlatformUnknown, ErrUnsupportedURL
}

func (v *Validator) ValidateDuration(duration int) error {
	if duration > v.maxDuration {
		return ErrDurationTooLong
	}
	return nil
}

