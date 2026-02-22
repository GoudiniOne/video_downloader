package handlers

import (
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"golang.org/x/net/proxy"

	"viddown/services"
)

type DownloadHandler struct {
	ytdlp     *services.YtDlpService
	semaphore *services.Semaphore
	logger    *slog.Logger
	proxyURL  string
}

func NewDownloadHandler(ytdlp *services.YtDlpService, semaphore *services.Semaphore, logger *slog.Logger, proxyURL string) *DownloadHandler {
	return &DownloadHandler{
		ytdlp:     ytdlp,
		semaphore: semaphore,
		logger:    logger,
		proxyURL:  proxyURL,
	}
}

func (h *DownloadHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	videoURL := r.URL.Query().Get("url")
	formatID := r.URL.Query().Get("format_id")
	formatType := r.URL.Query().Get("type")

	if videoURL == "" {
		http.Error(w, `{"error": "URL parameter is required"}`, http.StatusBadRequest)
		return
	}

	decodedURL, err := url.QueryUnescape(videoURL)
	if err != nil {
		h.logger.Error("Failed to decode URL", "error", err)
		http.Error(w, `{"error": "Invalid URL encoding"}`, http.StatusBadRequest)
		return
	}

	if formatID == "" {
		formatID = "best"
	}

	if !h.semaphore.TryAcquire() {
		h.logger.Warn("Server busy, all download slots occupied")
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusServiceUnavailable)
		w.Write([]byte(`{"error": "Сервер занят. Попробуйте позже."}`))
		return
	}
	defer h.semaphore.Release()

	ctx := r.Context()
	startTime := time.Now()

	// Check if this is a merged format (contains +)
	isMergedFormat := strings.Contains(formatID, "+")
	isAudioOnly := formatType == "audio"

	h.logger.Info("Starting download", "url", decodedURL, "format", formatID, "merged", isMergedFormat)

	if isMergedFormat {
		// For merged formats, stream through yt-dlp/ffmpeg
		h.streamMerged(w, r, ctx, decodedURL, formatID, isAudioOnly, startTime)
	} else {
		// For single formats, proxy stream directly from source
		h.streamDirect(w, r, ctx, decodedURL, formatID, startTime)
	}
}

// streamDirect proxies the video directly from YouTube's CDN
func (h *DownloadHandler) streamDirect(w http.ResponseWriter, r *http.Request, ctx interface{}, videoURL, formatID string, startTime time.Time) {
	// Get direct URL
	streamInfo, err := h.ytdlp.GetDirectURL(r.Context(), videoURL, formatID)
	if err != nil {
		h.logger.Error("Failed to get direct URL", "url", videoURL, "error", err)
		http.Error(w, `{"error": "Failed to get download URL"}`, http.StatusInternalServerError)
		return
	}

	h.logger.Info("Got direct URL", "filename", streamInfo.Filename)

	// Create HTTP client with proxy support
	transport := &http.Transport{}

	if h.proxyURL != "" {
		proxyParsed, err := url.Parse(h.proxyURL)
		if err == nil && (proxyParsed.Scheme == "socks5" || proxyParsed.Scheme == "socks5h") {
			// SOCKS5 proxy
			auth := &proxy.Auth{}
			if proxyParsed.User != nil {
				auth.User = proxyParsed.User.Username()
				auth.Password, _ = proxyParsed.User.Password()
			}
			dialer, err := proxy.SOCKS5("tcp", proxyParsed.Host, auth, proxy.Direct)
			if err == nil {
				transport.Dial = dialer.Dial
			}
		} else if proxyParsed.Scheme == "http" || proxyParsed.Scheme == "https" {
			// HTTP proxy
			transport.Proxy = http.ProxyURL(proxyParsed)
		}
	}

	client := &http.Client{
		Transport: transport,
		Timeout:   0, // No timeout for streaming
	}

	req, err := http.NewRequestWithContext(r.Context(), "GET", streamInfo.URL, nil)
	if err != nil {
		h.logger.Error("Failed to create request", "error", err)
		http.Error(w, `{"error": "Internal server error"}`, http.StatusInternalServerError)
		return
	}

	// Copy range header if present (for resume support)
	if rangeHeader := r.Header.Get("Range"); rangeHeader != "" {
		req.Header.Set("Range", rangeHeader)
	}

	// Set user agent
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

	resp, err := client.Do(req)
	if err != nil {
		h.logger.Error("Failed to fetch from source", "error", err)
		http.Error(w, `{"error": "Failed to download"}`, http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	// Set response headers
	sanitizedFilename := sanitizeFilename(streamInfo.Filename)
	encodedFilename := url.PathEscape(streamInfo.Filename)

	w.Header().Set("Content-Type", streamInfo.ContentType)
	if resp.ContentLength > 0 {
		w.Header().Set("Content-Length", fmt.Sprintf("%d", resp.ContentLength))
	}
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"; filename*=UTF-8''%s`, sanitizedFilename, encodedFilename))
	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Cache-Control", "no-cache")

	// Copy range headers from source response
	if resp.StatusCode == http.StatusPartialContent {
		w.Header().Set("Content-Range", resp.Header.Get("Content-Range"))
		w.WriteHeader(http.StatusPartialContent)
	}

	// Stream directly to client
	written, err := io.Copy(w, resp.Body)
	if err != nil {
		h.logger.Error("Stream interrupted", "error", err, "written", written)
		return
	}

	h.logger.Info("Download complete (direct)", "filename", streamInfo.Filename, "size", written, "duration", time.Since(startTime))
}

// streamMerged downloads merged video+audio to temp file then streams to client (original strategy)
func (h *DownloadHandler) streamMerged(w http.ResponseWriter, r *http.Request, ctx interface{}, videoURL, formatID string, isAudioOnly bool, startTime time.Time) {
	h.logger.Info("Downloading merged video", "formatID", formatID)

	tempPath, filename, cleanup, err := h.ytdlp.DownloadMergedToFile(r.Context(), videoURL, formatID)
	if err != nil {
		h.logger.Error("Merged download failed", "error", err)
		http.Error(w, `{"error": "Download failed"}`, http.StatusInternalServerError)
		return
	}
	defer cleanup()

	file, err := os.Open(tempPath)
	if err != nil {
		h.logger.Error("Failed to open temp file", "error", err)
		http.Error(w, `{"error": "Stream failed"}`, http.StatusInternalServerError)
		return
	}
	defer file.Close()

	stat, err := file.Stat()
	if err != nil {
		h.logger.Error("Failed to stat temp file", "error", err)
		http.Error(w, `{"error": "Stream failed"}`, http.StatusInternalServerError)
		return
	}

	sanitizedFilename := sanitizeFilename(filename)
	encodedFilename := url.PathEscape(filename)

	contentType := "video/mp4"
	if isAudioOnly {
		contentType = "audio/mp4"
	}

	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Length", fmt.Sprintf("%d", stat.Size()))
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"; filename*=UTF-8''%s`, sanitizedFilename, encodedFilename))
	w.Header().Set("Accept-Ranges", "bytes")
	w.Header().Set("Cache-Control", "no-cache")

	h.logger.Info("Streaming to client", "filename", filename, "size", stat.Size())

	written, err := io.Copy(w, file)
	if err != nil {
		h.logger.Error("Stream interrupted", "error", err, "written", written)
		return
	}

	h.logger.Info("Download complete (merged)", "filename", filename, "size", written, "duration", time.Since(startTime))
}

func sanitizeFilename(filename string) string {
	replacer := strings.NewReplacer(
		`"`, "'",
		`\`, "_",
		`/`, "_",
		`:`, "-",
		`*`, "_",
		`?`, "_",
		`<`, "_",
		`>`, "_",
		`|`, "_",
	)
	return replacer.Replace(filename)
}
