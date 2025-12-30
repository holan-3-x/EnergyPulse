// Package auth handles JWT token generation, validation, and password hashing.
// JWT (JSON Web Token) is used for stateless authentication in REST APIs.
package auth

import (
	"errors"
	"fmt"
	"os"
	"time"

	"energy-prediction/internal/models"
	"github.com/golang-jwt/jwt/v5"
)

// JWT configuration
var (
	jwtSecret     []byte
	TokenDuration = 24 * time.Hour // Tokens valid for 24 hours
)

// Claims represents the JWT payload structure.
// We embed jwt.RegisteredClaims and add custom fields.
type Claims struct {
	UserID   uint            `json:"userId"`
	Username string          `json:"username"`
	Role     models.UserRole `json:"role"`
	jwt.RegisteredClaims
}

// Init initializes the JWT secret from environment or uses default.
// In production, always use a secure secret from environment variables!
func Init() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// Default for development - CHANGE IN PRODUCTION!
		secret = "energy-prediction-super-secret-key-2024"
	}
	jwtSecret = []byte(secret)
}

// GenerateToken creates a new JWT token for the given user.
// The token includes user ID, username, and role in the claims.
func GenerateToken(user *models.User) (string, int64, error) {
	// Calculate expiration time
	expirationTime := time.Now().Add(TokenDuration)

	// Create claims with user information
	claims := &Claims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "energy-prediction-api",
			Subject:   fmt.Sprintf("%d", user.ID),
		},
	}

	// Create token with HS256 signing method
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token with secret
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", 0, fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, expirationTime.Unix(), nil
}

// ValidateToken parses and validates a JWT token string.
// Returns the claims if valid, or an error if invalid/expired.
func ValidateToken(tokenString string) (*Claims, error) {
	// Parse token with claims
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, errors.New("token has expired")
		}
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	// Extract claims
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}

// RefreshToken generates a new token for an existing valid token.
// The new token has a fresh expiration time.
func RefreshToken(tokenString string) (string, int64, error) {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return "", 0, err
	}

	// Create new token with same user info but new expiration
	user := &models.User{
		ID:       claims.UserID,
		Username: claims.Username,
		Role:     claims.Role,
	}

	return GenerateToken(user)
}

// GetUserIDFromToken extracts the user ID from a token string.
// Returns 0 and error if token is invalid.
func GetUserIDFromToken(tokenString string) (uint, error) {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return 0, err
	}
	return claims.UserID, nil
}
