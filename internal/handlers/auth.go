// Package handlers contains all HTTP endpoint handlers for the REST API.
// Handlers process requests, interact with the database, and return responses.
package handlers

import (
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"energy-prediction/internal/auth"
	"energy-prediction/internal/database"
	"energy-prediction/internal/models"

	"github.com/gin-gonic/gin"
)

// meterCounter tracks the next available meter ID (thread-safe)
var (
	meterCounter     int
	meterCounterOnce sync.Once
	meterMutex       sync.Mutex
)

// initMeterCounter initializes the meter counter from database
func initMeterCounter() {
	// Get all households to find the max meter number
	// (ORDER BY meter_id DESC uses string comparison which is wrong: household_9 > household_20)
	var households []models.Household
	database.DB.Find(&households)

	maxNum := 0
	for _, h := range households {
		var num int
		if _, err := fmt.Sscanf(h.MeterID, "household_%d", &num); err == nil {
			if num > maxNum {
				maxNum = num
			}
		}
	}
	meterCounter = maxNum
}

// getNextMeterID returns the next available meter ID (thread-safe)
func getNextMeterID() string {
	meterCounterOnce.Do(initMeterCounter)

	meterMutex.Lock()
	defer meterMutex.Unlock()

	meterCounter++
	return fmt.Sprintf("household_%d", meterCounter)
}

// getNextHouseID returns the next available house ID
func getNextHouseID() string {
	var count int64
	database.DB.Model(&models.Household{}).Count(&count)
	return fmt.Sprintf("house_%03d", count+1)
}

// Register creates a new user account with an initial house.
// POST /auth/register
func Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if username exists
	var existingUser models.User
	if result := database.DB.Where("username = ?", req.Username).First(&existingUser); result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
		return
	}

	// Check if email exists
	if result := database.DB.Where("email = ?", req.Email).First(&existingUser); result.Error == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	// Hash password
	hashedPassword, err := auth.HashPassword(req.Password)
	if err != nil {
		log.Printf("Failed to hash password: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process password"})
		return
	}

	// Begin transaction
	tx := database.DB.Begin()

	// Create user
	user := models.User{
		Username:     req.Username,
		PasswordHash: hashedPassword,
		Email:        req.Email,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Phone:        req.Phone,
		Role:         models.RoleUser,
	}

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		log.Printf("Failed to create user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Create initial house
	house := models.Household{
		ID:          getNextHouseID(),
		UserID:      user.ID,
		HouseName:   req.HouseName,
		Address:     req.Address,
		City:        req.City,
		Region:      req.Region,
		Country:     req.Country,
		Members:     req.Members,
		HeatingType: models.HeatingType(req.HeatingType),
		AreaSqm:     req.AreaSqm,
		YearBuilt:   req.YearBuilt,
		MeterID:     getNextMeterID(),
		Status:      models.StatusActive,
	}

	if err := tx.Create(&house).Error; err != nil {
		tx.Rollback()
		log.Printf("Failed to create house: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create house"})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("Failed to commit transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete registration"})
		return
	}

	// Generate JWT token
	token, expiresAt, err := auth.GenerateToken(&user)
	if err != nil {
		log.Printf("Failed to generate token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Create session
	session := models.Session{
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: time.Unix(expiresAt, 0),
	}
	database.DB.Create(&session)

	// Return response
	c.JSON(http.StatusCreated, models.LoginResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User:      user,
	})
}

// Login authenticates a user and returns a JWT token.
// POST /auth/login
func Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user by email
	var user models.User
	if result := database.DB.Where("email = ?", req.Email).First(&user); result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Verify password
	if !auth.VerifyPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token, expiresAt, err := auth.GenerateToken(&user)
	if err != nil {
		log.Printf("Failed to generate token: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Create session
	session := models.Session{
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: time.Unix(expiresAt, 0),
	}
	database.DB.Create(&session)

	// Return response
	c.JSON(http.StatusOK, models.LoginResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User:      user,
	})
}

// Logout invalidates the current session.
// POST /auth/logout
func Logout(c *gin.Context) {
	// Get token from header
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No authorization header"})
		return
	}

	// Extract token
	var tokenString string
	fmt.Sscanf(authHeader, "Bearer %s", &tokenString)

	// Delete session
	result := database.DB.Where("token = ?", tokenString).Delete(&models.Session{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to logout"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

// RefreshToken generates a new token from an existing valid token.
// POST /auth/refresh
func RefreshToken(c *gin.Context) {
	// Get old token
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No authorization header"})
		return
	}

	var oldToken string
	fmt.Sscanf(authHeader, "Bearer %s", &oldToken)

	// Validate and refresh
	newToken, expiresAt, err := auth.RefreshToken(oldToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context (set by middleware)
	userID := auth.GetUserID(c)

	// Delete old session
	database.DB.Where("token = ?", oldToken).Delete(&models.Session{})

	// Create new session
	session := models.Session{
		UserID:    userID,
		Token:     newToken,
		ExpiresAt: time.Unix(expiresAt, 0),
	}
	database.DB.Create(&session)

	c.JSON(http.StatusOK, gin.H{
		"token":     newToken,
		"expiresAt": expiresAt,
	})
}
