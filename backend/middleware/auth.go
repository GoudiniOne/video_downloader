package middleware

import (
	"context"
	"net/http"
)

// User represents an authenticated user (for future use)
type User struct {
	ID    string
	Email string
	Name  string
}

type contextKey string

const UserContextKey contextKey = "user"

// AuthProvider interface for future JWT/OAuth implementations
type AuthProvider interface {
	Validate(token string) (*User, error)
}

// NoAuthProvider is a stub that allows all requests (current implementation)
type NoAuthProvider struct{}

func (p *NoAuthProvider) Validate(token string) (*User, error) {
	return nil, nil
}

// JWTProvider placeholder for future JWT implementation
type JWTProvider struct {
	Secret string
}

func (p *JWTProvider) Validate(token string) (*User, error) {
	// TODO: Implement JWT validation
	return nil, nil
}

// OAuthProvider placeholder for future OAuth implementation
type OAuthProvider struct {
	ClientID     string
	ClientSecret string
}

func (p *OAuthProvider) Validate(token string) (*User, error) {
	// TODO: Implement OAuth validation
	return nil, nil
}

// AuthMiddleware creates authentication middleware
// When required=false, it passes all requests through
// When required=true, it validates the token using the provider
func AuthMiddleware(required bool, provider AuthProvider) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !required {
				next.ServeHTTP(w, r)
				return
			}

			token := r.Header.Get("Authorization")
			if token == "" {
				http.Error(w, `{"error": "Authorization required"}`, http.StatusUnauthorized)
				return
			}

			user, err := provider.Validate(token)
			if err != nil {
				http.Error(w, `{"error": "Invalid token"}`, http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UserContextKey, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}


