package handlers

import (
	"net/http"

	"energy-prediction/internal/auth"
	"energy-prediction/internal/database"
	"energy-prediction/internal/models"
	"github.com/gin-gonic/gin"
)

// GetProfile returns the current user's profile.
// GET /api/user/profile
func GetProfile(c *gin.Context) {
	userID := auth.GetUserID(c)

	var user models.User
	if result := database.DB.First(&user, userID); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user.ToResponse())
}

// UpdateProfile updates the current user's profile.
// PUT /api/user/profile
func UpdateProfile(c *gin.Context) {
	userID := auth.GetUserID(c)

	var req models.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build update map (only non-empty fields)
	updates := make(map[string]interface{})
	if req.FirstName != "" {
		updates["first_name"] = req.FirstName
	}
	if req.LastName != "" {
		updates["last_name"] = req.LastName
	}
	if req.Phone != "" {
		updates["phone"] = req.Phone
	}
	if req.AvatarURL != "" {
		updates["avatar_url"] = req.AvatarURL
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	// Update user
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if err := database.DB.Model(&user).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	// Reload user to get updated values
	database.DB.First(&user, userID)
	c.JSON(http.StatusOK, user.ToResponse())
}

// ChangePassword allows users to change their password.
// PUT /api/user/password
func ChangePassword(c *gin.Context) {
	userID := auth.GetUserID(c)

	var req models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Verify current password
	if !auth.VerifyPassword(req.CurrentPassword, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password is incorrect"})
		return
	}

	// Hash new password
	newHash, err := auth.HashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
		return
	}

	// Update password
	if err := database.DB.Model(&user).Update("password_hash", newHash).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to change password"})
		return
	}

	// Invalidate all sessions (force re-login)
	database.DB.Where("user_id = ?", userID).Delete(&models.Session{})

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully. Please login again."})
}
