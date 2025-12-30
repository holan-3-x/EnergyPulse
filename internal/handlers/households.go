package handlers

import (
	"net/http"

	"energy-prediction/internal/auth"
	"energy-prediction/internal/database"
	"energy-prediction/internal/models"
	"github.com/gin-gonic/gin"
)

// CreateHouse creates a new household for the current user.
// POST /api/houses
func CreateHouse(c *gin.Context) {
	userID := auth.GetUserID(c)

	var req models.CreateHouseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	house := models.Household{
		ID:          getNextHouseID(),
		UserID:      userID,
		HouseName:   req.HouseName,
		Address:     req.Address,
		City:        req.City,
		Region:      req.Region,
		Country:     req.Country,
		Members:     req.Members,
		HeatingType: req.HeatingType,
		AreaSqm:     req.AreaSqm,
		YearBuilt:   req.YearBuilt,
		MeterID:     getNextMeterID(),
		Status:      models.StatusActive,
	}

	if err := database.DB.Create(&house).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create house"})
		return
	}

	c.JSON(http.StatusCreated, house.ToResponse())
}

// GetHouses returns all houses for the current user (or all houses for admin).
// GET /api/houses
func GetHouses(c *gin.Context) {
	userID := auth.GetUserID(c)
	isAdmin := auth.IsAdmin(c)

	var houses []models.Household
	query := database.DB.Where("status = ?", models.StatusActive)

	// Admin sees all, regular user sees only their own
	if !isAdmin {
		query = query.Where("user_id = ?", userID)
	}

	if err := query.Order("created_at DESC").Find(&houses).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch houses"})
		return
	}

	// Convert to response format
	responses := make([]models.HouseholdResponse, len(houses))
	for i, h := range houses {
		responses[i] = h.ToResponse()
	}

	c.JSON(http.StatusOK, responses)
}

// GetHouse returns a specific house by ID.
// GET /api/houses/:house_id
func GetHouse(c *gin.Context) {
	userID := auth.GetUserID(c)
	isAdmin := auth.IsAdmin(c)
	houseID := c.Param("house_id")

	var house models.Household
	query := database.DB.Where("id = ?", houseID)

	// Non-admins can only see their own houses
	if !isAdmin {
		query = query.Where("user_id = ?", userID)
	}

	if err := query.First(&house).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "House not found"})
		return
	}

	c.JSON(http.StatusOK, house.ToResponse())
}

// UpdateHouse modifies an existing house.
// PUT /api/houses/:house_id
func UpdateHouse(c *gin.Context) {
	userID := auth.GetUserID(c)
	isAdmin := auth.IsAdmin(c)
	houseID := c.Param("house_id")

	// Find house
	var house models.Household
	query := database.DB.Where("id = ?", houseID)
	if !isAdmin {
		query = query.Where("user_id = ?", userID)
	}

	if err := query.First(&house).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "House not found"})
		return
	}

	var req models.UpdateHouseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build update map
	updates := make(map[string]interface{})
	if req.HouseName != "" {
		updates["house_name"] = req.HouseName
	}
	if req.Address != "" {
		updates["address"] = req.Address
	}
	if req.City != "" {
		updates["city"] = req.City
	}
	if req.Region != "" {
		updates["region"] = req.Region
	}
	if req.Country != "" {
		updates["country"] = req.Country
	}
	if req.Members > 0 {
		updates["household_members"] = req.Members
	}
	if req.HeatingType != "" {
		updates["heating_type"] = req.HeatingType
	}
	if req.AreaSqm > 0 {
		updates["area_sqm"] = req.AreaSqm
	}
	if req.YearBuilt > 0 {
		updates["year_built"] = req.YearBuilt
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	// Apply updates
	if err := database.DB.Model(&house).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update house"})
		return
	}

	// Reload and return
	database.DB.First(&house, "id = ?", houseID)
	c.JSON(http.StatusOK, house.ToResponse())
}

// DeleteHouse archives a house (soft delete).
// DELETE /api/houses/:house_id
func DeleteHouse(c *gin.Context) {
	userID := auth.GetUserID(c)
	isAdmin := auth.IsAdmin(c)
	houseID := c.Param("house_id")

	// Find house
	var house models.Household
	query := database.DB.Where("id = ?", houseID)
	if !isAdmin {
		query = query.Where("user_id = ?", userID)
	}

	if err := query.First(&house).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "House not found"})
		return
	}

	// Soft delete by setting status to archived
	if err := database.DB.Model(&house).Update("status", models.StatusArchived).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete house"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "House archived successfully"})
}
