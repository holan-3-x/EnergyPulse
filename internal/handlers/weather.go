package handlers

import (
	"energy-prediction/internal/weather"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetWeather returns the current weather for a specific city.
// GET /api/weather/:city
func GetWeather(c *gin.Context) {
	city := c.Param("city")
	if city == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "City parameter is required"})
		return
	}

	println("Fetching weather for city:", city)
	info, err := weather.GetWeather(city)
	if err != nil {
		println("Weather error for", city, ":", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch weather: " + err.Error()})
		return
	}
	println("Weather success:", city, info.Temperature, "C")

	c.JSON(http.StatusOK, info)
}
