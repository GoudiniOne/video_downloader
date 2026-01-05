package handlers

import (
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type ThumbnailHandler struct {
	logger *slog.Logger
	client *http.Client
}

func NewThumbnailHandler(logger *slog.Logger) *ThumbnailHandler {
	return &ThumbnailHandler{
		logger: logger,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (h *ThumbnailHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	thumbnailURL := r.URL.Query().Get("url")
	if thumbnailURL == "" {
		http.Error(w, "URL parameter is required", http.StatusBadRequest)
		return
	}

	// Decode URL
	decodedURL, err := url.QueryUnescape(thumbnailURL)
	if err != nil {
		h.logger.Error("Failed to decode thumbnail URL", "error", err)
		http.Error(w, "Invalid URL", http.StatusBadRequest)
		return
	}

	// Validate that it's a known thumbnail domain
	if !isAllowedThumbnailDomain(decodedURL) {
		h.logger.Warn("Blocked thumbnail request for unknown domain", "url", decodedURL)
		http.Error(w, "Domain not allowed", http.StatusForbidden)
		return
	}

	// Fetch the thumbnail
	req, err := http.NewRequestWithContext(r.Context(), "GET", decodedURL, nil)
	if err != nil {
		h.logger.Error("Failed to create request", "error", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
		return
	}

	// Set headers to look like a browser
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
	req.Header.Set("Accept", "image/*")
	req.Header.Set("Referer", "https://www.youtube.com/")

	resp, err := h.client.Do(req)
	if err != nil {
		h.logger.Error("Failed to fetch thumbnail", "url", decodedURL, "error", err)
		http.Error(w, "Failed to fetch thumbnail", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		h.logger.Warn("Thumbnail fetch failed", "url", decodedURL, "status", resp.StatusCode)
		http.Error(w, "Thumbnail not found", resp.StatusCode)
		return
	}

	// Copy headers
	contentType := resp.Header.Get("Content-Type")
	if contentType != "" {
		w.Header().Set("Content-Type", contentType)
	} else {
		w.Header().Set("Content-Type", "image/jpeg")
	}

	// Cache for 1 hour
	w.Header().Set("Cache-Control", "public, max-age=3600")

	// Stream response
	io.Copy(w, resp.Body)
}

func isAllowedThumbnailDomain(rawURL string) bool {
	allowedDomains := []string{
		"i.ytimg.com",
		"img.youtube.com",
		"i1.ytimg.com",
		"i2.ytimg.com",
		"i3.ytimg.com",
		"i4.ytimg.com",
		"i9.ytimg.com",
		"yt3.ggpht.com",
		"instagram.com",
		"cdninstagram.com",
		"scontent.cdninstagram.com",
		"tiktokcdn.com",
		"p16-sign-va.tiktokcdn.com",
		"p16-sign-sg.tiktokcdn.com",
	}

	parsedURL, err := url.Parse(rawURL)
	if err != nil {
		return false
	}

	host := strings.ToLower(parsedURL.Host)
	for _, domain := range allowedDomains {
		if host == domain || strings.HasSuffix(host, "."+domain) {
			return true
		}
	}

	return false
}

