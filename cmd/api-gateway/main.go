// Main entry point for the Energy Prediction API Gateway.
// This server provides REST API endpoints for user authentication,
// house management, and prediction access.
package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"energy-prediction/internal/auth"
	"energy-prediction/internal/blockchain"
	"energy-prediction/internal/database"
	"energy-prediction/internal/handlers"
	"energy-prediction/internal/mqtt"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	log.Println("========================================")
	log.Println("  EnergyPulse - Energy Price Prediction")
	log.Println("  API Gateway Starting...")
	log.Println("========================================")

	// Initialize JWT authentication
	auth.Init()

	// Connect to database
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "data/energy.db"
	}

	if err := database.Connect(dbPath); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	// Run migrations
	if err := database.AutoMigrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Seed demo data (only if empty)
	if err := database.SeedDummyData(); err != nil {
		log.Printf("Warning: Failed to seed data: %v", err)
	}

	// Initialize blockchain simulation
	blockchain.Init()

	// Start MQTT subscriber (optional - may fail if broker not running)
	mqttClient, err := mqtt.NewSubscriber()
	if err != nil {
		log.Printf("Warning: MQTT not available: %v", err)
		log.Println("The system will work without real-time meter data.")
	} else {
		defer mqttClient.Disconnect()
	}

	// Create Gin router
	router := gin.Default()

	// Configure CORS for frontend
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173", "http://localhost:3001", "*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Serve static files (frontend)
	router.Static("/static", "./static")
	router.StaticFile("/", "./static/index.html")

	// ========== Health Endpoints (Public) ==========
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().Format(time.RFC3339),
			"service":   "api-gateway",
		})
	})

	router.GET("/status", func(c *gin.Context) {
		// Check database
		sqlDB, _ := database.DB.DB()
		dbStatus := "connected"
		if err := sqlDB.Ping(); err != nil {
			dbStatus = "error"
		}

		// Check MQTT
		mqttStatus := "disconnected"
		if mqttClient != nil && mqttClient.IsConnected() {
			mqttStatus = "connected"
		}

		c.JSON(http.StatusOK, gin.H{
			"status":     "running",
			"database":   dbStatus,
			"mqtt":       mqttStatus,
			"blockchain": blockchain.GetStats(),
			"timestamp":  time.Now().Format(time.RFC3339),
		})
	})

	// ========== Authentication Endpoints (Public) ==========
	authGroup := router.Group("/auth")
	{
		authGroup.POST("/register", handlers.Register)
		authGroup.POST("/login", handlers.Login)
		authGroup.POST("/logout", handlers.Logout)
		authGroup.POST("/refresh", auth.JWTMiddleware(), handlers.RefreshToken)
	}

	// ========== User Endpoints (Protected) ==========
	userGroup := router.Group("/api/user")
	userGroup.Use(auth.JWTMiddleware())
	{
		userGroup.GET("/profile", handlers.GetProfile)
		userGroup.PUT("/profile", handlers.UpdateProfile)
		userGroup.PUT("/password", handlers.ChangePassword)
	}

	// ========== House Endpoints (Protected) ==========
	houseGroup := router.Group("/api/houses")
	houseGroup.Use(auth.JWTMiddleware())
	{
		houseGroup.POST("", handlers.CreateHouse)
		houseGroup.GET("", handlers.GetHouses)
		houseGroup.GET("/:house_id", handlers.GetHouse)
		houseGroup.PUT("/:house_id", handlers.UpdateHouse)
		houseGroup.DELETE("/:house_id", handlers.DeleteHouse)
		houseGroup.GET("/:house_id/forecast", handlers.GetForecast)
	}

	// ========== Prediction Endpoints (Protected) ==========
	predGroup := router.Group("/api/predictions")
	predGroup.Use(auth.JWTMiddleware())
	{
		predGroup.GET("", handlers.GetPredictions)
		predGroup.GET("/:prediction_id", handlers.GetPrediction)
	}

	// ========== Simulation Endpoint (Public - for Simulator) ==========
	// This allows the simulator to send data via HTTP if MQTT is not available
	router.POST("/api/simulate", func(c *gin.Context) {
		var data mqtt.MeterData
		if err := c.ShouldBindJSON(&data); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Process the data as if it came from MQTT
		mqtt.ProcessMeterData(data)

		c.JSON(http.StatusOK, gin.H{"status": "received", "meterId": data.MeterID})
	})

	// Statistics endpoint
	router.GET("/api/statistics", auth.JWTMiddleware(), handlers.GetStatistics)

	// Weather endpoint (Public)
	router.GET("/api/weather/:city", handlers.GetWeather)

	// ========== Admin Endpoints (Protected + Admin) ==========
	adminGroup := router.Group("/admin")
	adminGroup.Use(auth.JWTMiddleware(), auth.AdminMiddleware())
	{
		adminGroup.GET("/users", handlers.AdminGetUsers)
		adminGroup.PUT("/users/:user_id/role", handlers.AdminChangeRole)
		adminGroup.GET("/dashboard", handlers.AdminDashboard)
	}

	// SPA Routing: Serve index.html for any unknown route (except /api and /auth)
	router.NoRoute(func(c *gin.Context) {
		c.File("./static/index.html")
	})

	// Get port from environment or default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("========================================")
	log.Printf("  Server running on http://localhost:%s", port)
	log.Println("========================================")
	log.Println("")
	log.Println("Available endpoints:")
	log.Println("  POST /auth/register  - Create new account")
	log.Println("  POST /auth/login     - Login and get token")
	log.Println("  GET  /api/houses     - List houses")
	log.Println("  GET  /api/predictions - Get predictions")
	log.Println("  GET  /admin/dashboard - Admin stats")
	log.Println("")
	log.Println("Demo credentials:")
	log.Println("  Admin: admin@energypulse.it / password123")
	log.Println("  User:  mario.rossi@email.it / password123")
	log.Println("")

	// Start server
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
