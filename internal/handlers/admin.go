package handlers

import (
	"log"
	"net/http"
	"time"

	"energy-prediction/internal/database"
	"energy-prediction/internal/models"
	"energy-prediction/internal/mqtt"

	"github.com/gin-gonic/gin"
)

// AdminGetUsers returns all users (admin only).
// GET /admin/users
func AdminGetUsers(c *gin.Context) {
	var users []models.User
	if err := database.DB.Order("created_at DESC").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	// Convert to response format (exclude password hashes)
	responses := make([]models.UserResponse, len(users))
	for i, u := range users {
		responses[i] = u.ToResponse()
	}

	c.JSON(http.StatusOK, responses)
}

// AdminChangeRole changes a user's role (admin only).
// PUT /admin/users/:user_id/role
func AdminChangeRole(c *gin.Context) {
	userIdParam := c.Param("user_id")
	log.Printf("AdminChangeRole: Changing role for user ID %s", userIdParam)

	var req struct {
		Role models.UserRole `json:"role" binding:"required,oneof=admin user"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user
	var user models.User
	if err := database.DB.First(&user, userIdParam).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Update role
	if err := database.DB.Model(&user).Update("role", req.Role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update role"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Role updated successfully",
		"userId":  user.ID,
		"newRole": req.Role,
	})
}

// AdminDashboard returns system-wide statistics (admin only).
// GET /admin/dashboard
func AdminDashboard(c *gin.Context) {
	var response models.AdminDashboardResponse

	// Count users
	database.DB.Model(&models.User{}).Count(&response.TotalUsers)

	// Count households
	database.DB.Model(&models.Household{}).Where("status = ?", models.StatusActive).Count(&response.TotalHouseholds)

	// Count predictions
	database.DB.Model(&models.Prediction{}).Count(&response.TotalPredictions)

	// Count active sessions
	database.DB.Model(&models.Session{}).Where("expires_at > ?", time.Now()).Count(&response.ActiveSessions)

	// Count blockchain confirmed
	database.DB.Model(&models.Prediction{}).Where("blockchain_confirmed = ?", true).Count(&response.BlockchainConfirmed)

	// Get recent predictions
	var recentPreds []models.Prediction
	database.DB.Order("created_at DESC").Limit(10).Find(&recentPreds)

	response.RecentPredictions = make([]models.PredictionResponse, len(recentPreds))
	for i, p := range recentPreds {
		response.RecentPredictions[i] = p.ToResponse()
	}

	// System health check
	response.SystemHealth = "healthy"
	response.ServiceStatus = make(map[string]string)
	response.ServiceStatus["api_gateway"] = "healthy"
	response.ServiceStatus["mqtt"] = "healthy"
	response.ServiceStatus["blockchain"] = "healthy"
	response.ServiceStatus["database"] = "healthy"

	// Check database connection
	sqlDB, err := database.DB.DB()
	if err != nil || sqlDB.Ping() != nil {
		response.SystemHealth = "database_error"
		response.ServiceStatus["database"] = "error"
	}

	// Check MQTT (if imported, let's check if we need to add imports)
	// We need to import mqtt package.
	// Wait, I am in handlers package. Let's see imports.
	if mqtt.ActiveClient == nil || !mqtt.ActiveClient.IsConnected() {
		response.ServiceStatus["mqtt"] = "error"
	}

	c.JSON(http.StatusOK, response)
}
