package services

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type Format struct {
	ID      string `json:"id"`
	Type    string `json:"type"`
	Quality string `json:"quality"`
	Ext     string `json:"ext"`
	Size    int64  `json:"size,omitempty"`
}

type VideoInfo struct {
	Platform  Platform `json:"platform"`
	Title     string   `json:"title"`
	Duration  int      `json:"duration"`
	Thumbnail string   `json:"thumbnail"`
	Formats   []Format `json:"formats"`
}

type YtDlpService struct {
	ytdlpPath   string
	cookiesFile string
	proxyURL    string
	validator   *Validator
}

func NewYtDlpService(ytdlpPath, cookiesFile, proxyURL string, validator *Validator) *YtDlpService {
	return &YtDlpService{
		ytdlpPath:   ytdlpPath,
		cookiesFile: cookiesFile,
		proxyURL:    proxyURL,
		validator:   validator,
	}
}

type ytdlpFormat struct {
	FormatID   string  `json:"format_id"`
	Ext        string  `json:"ext"`
	Resolution string  `json:"resolution"`
	VCodec     string  `json:"vcodec"`
	ACodec     string  `json:"acodec"`
	Filesize   int64   `json:"filesize"`
	ABR        float64 `json:"abr"`
	Height     int     `json:"height"`
	FormatNote string  `json:"format_note"`
}

type ytdlpInfo struct {
	Title     string        `json:"title"`
	Duration  float64       `json:"duration"`
	Thumbnail string        `json:"thumbnail"`
	Formats   []ytdlpFormat `json:"formats"`
	Extractor string        `json:"extractor"`
}

func (s *YtDlpService) Analyze(ctx context.Context, url string) (*VideoInfo, error) {
	platform, err := s.validator.ValidateURL(url)
	if err != nil {
		return nil, err
	}

	args := []string{
		"--dump-json",
		"--no-download",
		"--no-warnings",
		"--no-playlist",
		"--force-ipv4",
	}

	// Add cookies if file exists
	if s.cookiesFile != "" {
		if _, err := os.Stat(s.cookiesFile); err == nil {
			args = append(args, "--cookies", s.cookiesFile)
		}
	}

	// Add proxy if configured
	if s.proxyURL != "" {
		args = append(args, "--proxy", s.proxyURL)
	}

	args = append(args, url)
	cmd := exec.CommandContext(ctx, s.ytdlpPath, args...)

	output, err := cmd.Output()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return nil, fmt.Errorf("yt-dlp error: %s", string(exitErr.Stderr))
		}
		return nil, fmt.Errorf("failed to execute yt-dlp: %w", err)
	}

	var info ytdlpInfo
	if err := json.Unmarshal(output, &info); err != nil {
		return nil, fmt.Errorf("failed to parse yt-dlp output: %w", err)
	}

	duration := int(info.Duration)

	formats := s.parseFormats(info.Formats)

	return &VideoInfo{
		Platform:  platform,
		Title:     info.Title,
		Duration:  duration,
		Thumbnail: info.Thumbnail,
		Formats:   formats,
	}, nil
}

func (s *YtDlpService) parseFormats(ytFormats []ytdlpFormat) []Format {
	var formats []Format
	seen := make(map[string]bool)

	for _, f := range ytFormats {
		if f.FormatID == "" {
			continue
		}

		var formatType, quality string

		if f.VCodec == "none" && f.ACodec != "none" {
			formatType = "audio"
			if f.ABR > 0 {
				quality = fmt.Sprintf("%.0fkbps", f.ABR)
			} else {
				quality = "audio"
			}
		} else if f.VCodec != "none" {
			formatType = "video"
			// Prefer only mp4 container for better compatibility on Windows
			if f.Ext != "mp4" {
				continue
			}
			if f.Height > 0 {
				quality = fmt.Sprintf("%dp", f.Height)
			} else if f.Resolution != "" && f.Resolution != "audio only" {
				quality = f.Resolution
			} else {
				continue
			}
		} else {
			continue
		}

		key := fmt.Sprintf("%s-%s-%s", formatType, quality, f.Ext)
		if seen[key] {
			continue
		}
		seen[key] = true

		formats = append(formats, Format{
			ID:      f.FormatID,
			Type:    formatType,
			Quality: quality,
			Ext:     f.Ext,
			Size:    f.Filesize,
		})
	}

	return formats
}

// StreamInfo contains information for streaming a video
type StreamInfo struct {
	URL         string
	Filename    string
	ContentType string
	Size        int64
}

// GetDirectURL gets the direct download URL for a format
func (s *YtDlpService) GetDirectURL(ctx context.Context, url, formatID string) (*StreamInfo, error) {
	_, err := s.validator.ValidateURL(url)
	if err != nil {
		return nil, err
	}

	// Build arguments to get URL and filename
	args := []string{
		"-f", formatID,
		"--get-url",
		"--get-filename",
		"-o", "%(title)s.%(ext)s",
		"--no-warnings",
		"--no-playlist",
		"--force-ipv4",
	}

	// Add cookies if file exists
	if s.cookiesFile != "" {
		if _, err := os.Stat(s.cookiesFile); err == nil {
			args = append(args, "--cookies", s.cookiesFile)
		}
	}

	// Add proxy if configured
	if s.proxyURL != "" {
		args = append(args, "--proxy", s.proxyURL)
	}

	args = append(args, url)
	cmd := exec.CommandContext(ctx, s.ytdlpPath, args...)

	output, err := cmd.Output()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return nil, fmt.Errorf("failed to get URL: %s", string(exitErr.Stderr))
		}
		return nil, fmt.Errorf("failed to get URL: %w", err)
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	if len(lines) < 2 {
		return nil, fmt.Errorf("invalid yt-dlp output")
	}

	// Last line is filename, everything before is URLs (could be multiple for merged formats)
	filename := lines[len(lines)-1]
	directURL := lines[0]

	// Determine content type from extension
	ext := filepath.Ext(filename)
	contentType := "application/octet-stream"
	switch ext {
	case ".mp4":
		contentType = "video/mp4"
	case ".webm":
		contentType = "video/webm"
	case ".m4a":
		contentType = "audio/mp4"
	case ".mp3":
		contentType = "audio/mpeg"
	case ".opus":
		contentType = "audio/opus"
	}

	return &StreamInfo{
		URL:         directURL,
		Filename:    filename,
		ContentType: contentType,
	}, nil
}

// GetDirectURLs gets direct download URLs for merged formats (video + audio separately)
func (s *YtDlpService) GetDirectURLs(ctx context.Context, url, formatID string) (videoURL, audioURL, filename string, err error) {
	_, err = s.validator.ValidateURL(url)
	if err != nil {
		return "", "", "", err
	}

	// Build arguments to get URLs
	args := []string{
		"-f", formatID,
		"--get-url",
		"--get-filename",
		"-o", "%(title)s.mp4",
		"--no-warnings",
		"--no-playlist",
		"--force-ipv4",
	}

	if s.cookiesFile != "" {
		if _, err := os.Stat(s.cookiesFile); err == nil {
			args = append(args, "--cookies", s.cookiesFile)
		}
	}

	if s.proxyURL != "" {
		args = append(args, "--proxy", s.proxyURL)
	}

	args = append(args, url)
	cmd := exec.CommandContext(ctx, s.ytdlpPath, args...)

	output, err := cmd.Output()
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return "", "", "", fmt.Errorf("failed to get URLs: %s", string(exitErr.Stderr))
		}
		return "", "", "", fmt.Errorf("failed to get URLs: %w", err)
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	if len(lines) < 3 {
		return "", "", "", fmt.Errorf("invalid yt-dlp output for merged format")
	}

	// For merged formats: URL1 (video), URL2 (audio), filename
	videoURL = lines[0]
	audioURL = lines[1]
	filename = lines[len(lines)-1]

	return videoURL, audioURL, filename, nil
}

// DownloadMergedToFile downloads merged video+audio to temp file (original strategy)
// yt-dlp handles merge with ffmpeg -c:a aac for AAC/Opus compatibility
func (s *YtDlpService) DownloadMergedToFile(ctx context.Context, sourceURL, formatID string) (tempPath string, filename string, cleanup func(), err error) {
	tempDir := "/tmp/viddown"
	if err := os.MkdirAll(tempDir, 0755); err != nil {
		return "", "", nil, fmt.Errorf("failed to create temp dir: %w", err)
	}

	prefix := fmt.Sprintf("dl_%d_%%(id)s", time.Now().UnixNano())
	outputTemplate := filepath.Join(tempDir, prefix+".%(ext)s")

	args := []string{
		"-f", formatID,
		"-o", outputTemplate,
		"--no-warnings",
		"--no-playlist",
		"--no-mtime",
		"--force-overwrites",
		"--merge-output-format", "mp4",
		"--postprocessor-args", "ffmpeg:-c:v copy -c:a aac -strict experimental",
	}

	if s.cookiesFile != "" {
		if _, err := os.Stat(s.cookiesFile); err == nil {
			args = append(args, "--cookies", s.cookiesFile)
		}
	}

	if s.proxyURL != "" {
		args = append(args, "--proxy", s.proxyURL)
	}

	args = append(args, "--force-ipv4", sourceURL)

	cmd := exec.CommandContext(ctx, s.ytdlpPath, args...)
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			return "", "", nil, fmt.Errorf("yt-dlp failed: %s", string(exitErr.Stderr))
		}
		return "", "", nil, fmt.Errorf("yt-dlp failed: %w", err)
	}

	// Find the merged .mp4 file (most recently modified)
	mp4Matches, _ := filepath.Glob(filepath.Join(tempDir, "dl_*.mp4"))
	var downloadedPath string
	var modTime int64
	for _, m := range mp4Matches {
		if info, err := os.Stat(m); err == nil && info.ModTime().Unix() > modTime {
			modTime = info.ModTime().Unix()
			downloadedPath = m
		}
	}
	if downloadedPath == "" {
		return "", "", nil, fmt.Errorf("could not find downloaded file")
	}

	cleanup = func() {
		os.Remove(downloadedPath)
	}

	filename = filepath.Base(downloadedPath)
	return downloadedPath, filename, cleanup, nil
}

// StreamToWriter streams video directly to a writer (for single format or audio-only)
func (s *YtDlpService) StreamToWriter(ctx context.Context, url, formatID string, w io.Writer, isAudioOnly bool) (filename string, err error) {
	_, err = s.validator.ValidateURL(url)
	if err != nil {
		return "", err
	}

	// Build arguments - output to stdout
	args := []string{
		"-f", formatID,
		"-o", "-",
		"--no-warnings",
		"--no-playlist",
		"--force-ipv4",
	}

	if s.cookiesFile != "" {
		if _, err := os.Stat(s.cookiesFile); err == nil {
			args = append(args, "--cookies", s.cookiesFile)
		}
	}

	if s.proxyURL != "" {
		args = append(args, "--proxy", s.proxyURL)
	}

	args = append(args, url)

	cmd := exec.CommandContext(ctx, s.ytdlpPath, args...)
	cmd.Stdout = w
	cmd.Stderr = os.Stderr

	filename, _ = s.GetFilename(ctx, url, formatID)
	if filename == "" {
		filename = "video.mp4"
	}

	err = cmd.Run()
	if err != nil {
		return filename, fmt.Errorf("stream failed: %w", err)
	}

	return filename, nil
}

func (s *YtDlpService) GetBestFormats(formats []Format) []Format {
	var best []Format

	// Find best audio format
	var bestAudio *Format
	for i := range formats {
		f := &formats[i]
		if f.Type == "audio" {
			if bestAudio == nil {
				bestAudio = f
			} else {
				currentBitrate := extractBitrate(f.Quality)
				bestBitrate := extractBitrate(bestAudio.Quality)
				if currentBitrate > bestBitrate {
					bestAudio = f
				}
			}
		}
	}

	// Add best audio option
	if bestAudio != nil {
		best = append(best, Format{
			ID:      bestAudio.ID,
			Type:    "audio",
			Quality: "Лучшее аудио (" + bestAudio.Quality + ")",
			Ext:     "m4a", // Always convert to m4a for compatibility
			Size:    bestAudio.Size,
		})
	}

	// Find best video formats by resolution and create video+audio combos
	resolutions := []int{360, 480, 720, 1080}
	resLabels := map[int]string{360: "360p", 480: "480p", 720: "720p HD", 1080: "1080p Full HD"}

	for _, res := range resolutions {
		for _, f := range formats {
			if f.Type == "video" && strings.HasPrefix(f.Quality, strconv.Itoa(res)) {
				// Video with audio (merged)
				if bestAudio != nil {
					best = append(best, Format{
						ID:      f.ID + "+" + bestAudio.ID,
						Type:    "video",
						Quality: resLabels[res] + " (видео + аудио)",
						Ext:     "mp4",
						Size:    f.Size + bestAudio.Size,
					})
				}
				// Video only (no audio)
				best = append(best, Format{
					ID:      f.ID,
					Type:    "video_only",
					Quality: resLabels[res] + " (только видео)",
					Ext:     f.Ext,
					Size:    f.Size,
				})
				break
			}
		}
	}

	return best
}

// GetFilename returns the filename for a given URL and format without downloading
func (s *YtDlpService) GetFilename(ctx context.Context, url, formatID string) (string, error) {
	// For merged formats, use the base format ID
	baseFormatID := formatID
	if strings.Contains(formatID, "+") {
		parts := strings.Split(formatID, "+")
		baseFormatID = parts[0]
	}

	cmd := exec.CommandContext(ctx, s.ytdlpPath,
		"--get-filename",
		"-f", baseFormatID,
		"-o", "%(title)s.%(ext)s",
		"--no-warnings",
		url,
	)

	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get filename: %w", err)
	}

	filename := strings.TrimSpace(string(output))

	// If merging, change extension to mp4
	if strings.Contains(formatID, "+") && !strings.HasSuffix(filename, ".mp4") {
		parts := strings.Split(filename, ".")
		if len(parts) > 1 {
			parts[len(parts)-1] = "mp4"
			filename = strings.Join(parts, ".")
		}
	}

	return filename, nil
}

func extractBitrate(quality string) int {
	quality = strings.TrimSuffix(quality, "kbps")
	if bitrate, err := strconv.Atoi(quality); err == nil {
		return bitrate
	}
	return 0
}
