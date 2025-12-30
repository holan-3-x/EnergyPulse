package handlers

import (
	"net/http"
	"time"

	"energy-prediction/internal/auth"
	"energy-prediction/internal/database"
	"energy-prediction/internal/models"
	"github.com/gin-gonic/gin"
)

// GetPredictions returns predictions with optional filters.
// GET /api/predictions
func GetPredictions(c *gin.Context) {
	userID := auth.GetUserID(c)
	isAdmin := auth.IsAdmin(c)

	var query models.PredictionQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set defaults
	if query.Page < 1 {
		query.Page = 1
	}
	if query.Limit < 1 || query.Limit > 100 {
		query.Limit = 20
	}

	// Build query
	dbQuery := database.DB.Model(&models.Prediction{})

	// Non-admins can only see their own predictions
	if !isAdmin {
		dbQuery = dbQuery.Where("user_id = ?", userID)
	}

	// Apply filters
	if query.HouseID != "" {
		dbQuery = dbQuery.Where("house_id = ?", query.HouseID)
	}
	if query.MeterID != "" {
		dbQuery = dbQuery.Where("meter_id = ?", query.MeterID)
	}
	if query.StartDate != "" {
		startTime, _ := time.Parse("2006-01-02", query.StartDate)
		dbQuery = dbQuery.Where("timestamp >= ?", startTime)
	}
	if query.EndDate != "" {
		endTime, _ := time.Parse("2006-01-02", query.EndDate)
		endTime = endTime.Add(24 * time.Hour) // Include the entire end date
		dbQuery = dbQuery.Where("timestamp < ?", endTime)
	}

	// Get total count
	var total int64
	dbQuery.Count(&total)

	// Apply pagination
	offset := (query.Page - 1) * query.Limit
	var predictions []models.Prediction
	if err := dbQuery.Order("timestamp DESC").Offset(offset).Limit(query.Limit).Find(&predictions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch predictions"})
		return
	}

	// Convert to response format
	responses := make([]models.PredictionResponse, len(predictions))
	for i, p := range predictions {
		responses[i] = p.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"predictions": responses,
		"total":       total,
		"page":        query.Page,
		"limit":       query.Limit,
		"totalPages":  (total + int64(query.Limit) - 1) / int64(query.Limit),
	})
}

// GetPrediction returns a single prediction by ID.
// GET /api/predictions/:prediction_id
func GetPrediction(c *gin.Context) {
	userID := auth.GetUserID(c)
	isAdmin := auth.IsAdmin(c)
	predictionID := c.Param("prediction_id")

	var prediction models.Prediction
	query := database.DB.Where("id = ?", predictionID)

	if !isAdmin {
		query = query.Where("user_id = ?", userID)
	}

	if err := query.First(&prediction).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Prediction not found"})
		return
	}

	c.JSON(http.StatusOK, prediction.ToResponse())
}

// GetStatistics returns aggregated statistics for the user (or all for admin).
// GET /api/statistics
func GetStatistics(c *gin.Context) {
	userID := auth.GetUserID(c)
	isAdmin := auth.IsAdmin(c)

	var stats models.StatisticsResponse

	// Build base queries
	predQuery := database.DB.Model(&models.Prediction{})
	houseQuery := database.DB.Model(&models.Household{}).Where("status = ?", models.StatusActive)

	if !isAdmin {
		predQuery = predQuery.Where("user_id = ?", userID)
		houseQuery = houseQuery.Where("user_id = ?", userID)
	}

	// Count predictions
	predQuery.Count(&stats.TotalPredictions)

	// Count households
	houseQuery.Count(&stats.TotalHouseholds)

	// Calculate averages
	var avgResult struct {
		AvgPrice       float64
		AvgConsumption float64
	}
	avgQuery := database.DB.Model(&models.Prediction{})
	if !isAdmin {
		avgQuery = avgQuery.Where("user_id = ?", userID)
	}
	avgQuery.Select("AVG(predicted_price) as avg_price, AVG(consumption_kwh) as avg_consumption").Scan(&avgResult)
	stats.AveragePrice = avgResult.AvgPrice
	stats.AverageConsumption = avgResult.AvgConsumption

	// Count blockchain confirmed
	confirmQuery := database.DB.Model(&models.Prediction{}).Where("blockchain_confirmed = ?", true)
	if !isAdmin {
		confirmQuery = confirmQuery.Where("user_id = ?", userID)
	}
	confirmQuery.Count(&stats.BlockchainConfirmed)

	// Get last prediction timestamp
	var lastPred models.Prediction
	lastQuery := database.DB.Model(&models.Prediction{}).Order("timestamp DESC")
	if !isAdmin {
		lastQuery = lastQuery.Where("user_id = ?", userID)
	}
	if err := lastQuery.First(&lastPred).Error; err == nil {
		stats.LastPredictionAt = lastPred.Timestamp.Format(time.RFC3339)
	}

	c.JSON(http.StatusOK, stats)
}
