package auth

import (
	"net/http"
	"strings"
	"time"

	"energy-prediction/internal/database"
	"energy-prediction/internal/models"
	"github.com/gin-gonic/gin"
)

// ContextKey is used for storing values in Gin context
const (
	ContextUserID   = "userId"
	ContextUsername = "username"
	ContextRole     = "role"
)

// JWTMiddleware validates JWT tokens in the Authorization header.
// Protected routes should use this middleware.
func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		// Extract token (format: "Bearer <token>")
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format. Use: Bearer <token>"})
			c.Abort()
			return
		}
		tokenString := parts[1]

		// Validate token
		claims, err := ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			c.Abort()
			return
		}

		// Check if session exists and is not expired
		var session models.Session
		result := database.DB.Where("token = ? AND expires_at > ?", tokenString, time.Now()).First(&session)
		if result.Error != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Session expired or invalid"})
			c.Abort()
			return
		}

		// Store user info in context for handlers to access
		c.Set(ContextUserID, claims.UserID)
		c.Set(ContextUsername, claims.Username)
		c.Set(ContextRole, claims.Role)

		c.Next()
	}
}

// AdminMiddleware ensures the user has admin role.
// Must be used after JWTMiddleware.
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get(ContextRole)
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User role not found"})
			c.Abort()
			return
		}

		if role != models.RoleAdmin {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// GetUserID extracts user ID from Gin context.
// Returns 0 if not found.
func GetUserID(c *gin.Context) uint {
	userID, exists := c.Get(ContextUserID)
	if !exists {
		return 0
	}
	return userID.(uint)
}

// GetUsername extracts username from Gin context.
func GetUsername(c *gin.Context) string {
	username, exists := c.Get(ContextUsername)
	if !exists {
		return ""
	}
	return username.(string)
}

// GetRole extracts user role from Gin context.
func GetRole(c *gin.Context) models.UserRole {
	role, exists := c.Get(ContextRole)
	if !exists {
		return models.RoleUser
	}
	return role.(models.UserRole)
}

// IsAdmin checks if the current user is an admin.
func IsAdmin(c *gin.Context) bool {
	return GetRole(c) == models.RoleAdmin
}
