package middleware

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

type visitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type RateLimiter struct {
	visitors map[string]*visitor
	mu       sync.RWMutex
	rpm      int
}

func NewRateLimiter(rpm int) *RateLimiter {
	rl := &RateLimiter{
		visitors: make(map[string]*visitor),
		rpm:      rpm,
	}
	go rl.cleanupVisitors()
	return rl
}

func (rl *RateLimiter) getVisitor(ip string) *rate.Limiter {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	v, exists := rl.visitors[ip]
	if !exists {
		limiter := rate.NewLimiter(rate.Every(time.Minute/time.Duration(rl.rpm)), rl.rpm)
		rl.visitors[ip] = &visitor{limiter: limiter, lastSeen: time.Now()}
		return limiter
	}

	v.lastSeen = time.Now()
	return v.limiter
}

func (rl *RateLimiter) cleanupVisitors() {
	for {
		time.Sleep(time.Minute)
		rl.mu.Lock()
		for ip, v := range rl.visitors {
			if time.Since(v.lastSeen) > 3*time.Minute {
				delete(rl.visitors, ip)
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
			// X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
			// Take the first one (original client)
			if idx := strings.Index(forwarded, ","); idx != -1 {
				ip = strings.TrimSpace(forwarded[:idx])
			} else {
				ip = strings.TrimSpace(forwarded)
			}
		}
		// Strip port from IP if present (e.g., "192.168.1.1:12345" -> "192.168.1.1")
		if idx := strings.LastIndex(ip, ":"); idx != -1 {
			// Check if this looks like IPv6 (contains multiple colons)
			if strings.Count(ip, ":") == 1 {
				ip = ip[:idx]
			}
		}

		limiter := rl.getVisitor(ip)
		if !limiter.Allow() {
			w.Header().Set("Content-Type", "application/json")
			w.Header().Set("Retry-After", "60")
			http.Error(w, `{"error": "Слишком много запросов. Подождите минуту."}`, http.StatusTooManyRequests)
			return
		}

		next.ServeHTTP(w, r)
	})
}


