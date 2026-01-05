package handlers

import (
	"encoding/json"
	"net/http"
	"os/exec"
	"time"
)

type HealthHandler struct {
	ytdlpPath string
	startTime time.Time
}

func NewHealthHandler(ytdlpPath string) *HealthHandler {
	return &HealthHandler{
		ytdlpPath: ytdlpPath,
		startTime: time.Now(),
	}
}

type HealthResponse struct {
	Status    string `json:"status"`
	Uptime    string `json:"uptime"`
	YtDlp     string `json:"yt_dlp"`
	Timestamp string `json:"timestamp"`
}

func (h *HealthHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ytdlpVersion := "unknown"
	cmd := exec.Command(h.ytdlpPath, "--version")
	if output, err := cmd.Output(); err == nil {
		ytdlpVersion = string(output)
		if len(ytdlpVersion) > 0 && ytdlpVersion[len(ytdlpVersion)-1] == '\n' {
			ytdlpVersion = ytdlpVersion[:len(ytdlpVersion)-1]
		}
	}

	response := HealthResponse{
		Status:    "ok",
		Uptime:    time.Since(h.startTime).Round(time.Second).String(),
		YtDlp:     ytdlpVersion,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}


