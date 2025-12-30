package auth

import (
	"golang.org/x/crypto/bcrypt"
)

// DefaultCost is the bcrypt cost factor (higher = more secure but slower)
const DefaultCost = 10

// HashPassword generates a bcrypt hash from a plaintext password.
// bcrypt automatically includes a salt, making each hash unique.
func HashPassword(password string) (string, error) {
	// GenerateFromPassword returns a bcrypt hash of the password
	// The cost factor determines the computational expense
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), DefaultCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// VerifyPassword compares a plaintext password against a stored hash.
// Returns true if they match, false otherwise.
func VerifyPassword(password, hash string) bool {
	// CompareHashAndPassword returns nil on success
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
