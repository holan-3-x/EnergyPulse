package weather

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

// WeatherInfo represents current and forecast weather data
type WeatherInfo struct {
	Temperature float64 `json:"temperature"`
	WindSpeed   float64 `json:"windspeed"`
	WeatherCode int     `json:"weathercode"`
	Time        string  `json:"time"`
	City        string  `json:"city"`
}

// OpenMeteoResponse is the raw response from Open-Meteo API
type OpenMeteoResponse struct {
	CurrentWeather struct {
		Temperature float64 `json:"temperature"`
		WindSpeed   float64 `json:"windspeed"`
		WeatherCode int     `json:"weathercode"`
		Time        string  `json:"time"`
	} `json:"current_weather"`
}

// GetWeather fetches current weather for a specific city by using its coordinates.
// For simplicity in this demo, we use a map of major Italian city coordinates.
func GetWeather(city string) (*WeatherInfo, error) {
	city = strings.Title(strings.ToLower(city))
	println("Service: Requesting weather for", city)

	coords := map[string][2]float64{
		"Milano":   {45.4642, 9.1899},
		"Milan":    {45.4642, 9.1899},
		"Roma":     {41.8919, 12.5113},
		"Rome":     {41.8919, 12.5113},
		"Napoli":   {40.8518, 14.2681},
		"Naples":   {40.8518, 14.2681},
		"Torino":   {45.0703, 7.6869},
		"Turin":    {45.0703, 7.6869},
		"Firenze":  {43.7696, 11.2558},
		"Florence": {43.7696, 11.2558},
		"Bologna":  {44.4949, 11.3426},
		"Genova":   {44.4056, 8.9463},
		"Palermo":  {38.1157, 13.3615},
		"Venezia":  {45.4408, 12.3155},
		"Venice":   {45.4408, 12.3155},
		"Catania":  {37.5025, 15.0873},
		"Bari":     {41.1171, 16.8719},
		"Verona":   {45.4384, 10.9916},
	}

	c, ok := coords[city]
	if !ok {
		println("Service: City not in list, defaulting to Roma")
		c = coords["Roma"]
		city = "Roma"
	}

	url := fmt.Sprintf("https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current_weather=true", c[0], c[1])

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var omResp OpenMeteoResponse
	if err := json.NewDecoder(resp.Body).Decode(&omResp); err != nil {
		return nil, err
	}

	return &WeatherInfo{
		Temperature: omResp.CurrentWeather.Temperature,
		WindSpeed:   omResp.CurrentWeather.WindSpeed,
		WeatherCode: omResp.CurrentWeather.WeatherCode,
		Time:        omResp.CurrentWeather.Time,
		City:        city,
	}, nil
}
