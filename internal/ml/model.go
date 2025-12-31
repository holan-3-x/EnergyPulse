// Package ml implements the machine learning model for energy price prediction.
// For simplicity, we use a rule-based decision tree that mimics Italian market patterns.
// In production, you would train a real ML model using libraries like golearn.
package ml

import (
	"energy-prediction/internal/models"
	"math"
	"strings"
	"time"
)

// PredictPrice uses a decision tree approach to predict energy prices.
// Parameters:
//   - household: The house details for personalization
//   - hour: Hour of the day (0-23)
//   - temperature: Outdoor temperature in Celsius
//   - consumption: Current consumption in kWh
//
// Returns:
//   - price: Predicted price in €/kWh
//   - confidence: Confidence percentage (0-100)
func PredictPrice(household *models.Household, hour int, temperature, consumption float64) (float64, int) {
	// Base price (Italian market average)
	basePrice := 0.12 // €/kWh (Updated for 2024 realism)

	// --- 1. Regional Variation Factor ---
	regionFactor := 1.0
	region := ""
	if household != nil {
		region = strings.ToLower(household.Region)
	}

	switch {
	case strings.Contains(region, "lombardia") || strings.Contains(region, "milano"):
		regionFactor = 1.05
	case strings.Contains(region, "sicilia") || strings.Contains(region, "sardegna"):
		regionFactor = 1.12
	case strings.Contains(region, "lazio") || strings.Contains(region, "roma"):
		regionFactor = 1.08
	default:
		regionFactor = 1.00
	}

	// --- 2. Household Size (Members) Influence ---
	membersFactor := 1.0
	if household != nil {
		if household.Members > 4 {
			membersFactor = 1.10
		} else if household.Members <= 2 {
			membersFactor = 0.95
		}
	}

	// --- 3. Area & Efficiency Correlation ---
	areaFactor := 1.0
	if household != nil {
		if household.AreaSqm > 150 {
			areaFactor = 1.07
		} else if household.AreaSqm < 60 {
			areaFactor = 0.98
		}
	}

	// --- 4. Building Efficiency & Seasonality ---
	efficiencyFactor := 1.0
	month := time.Now().Month()

	if household != nil {
		// Heating Type
		switch household.HeatingType {
		case models.HeatingElectric:
			efficiencyFactor *= 0.90
		case models.HeatingHeatPump:
			efficiencyFactor *= 0.85
		case models.HeatingGas:
			efficiencyFactor *= 1.05
		}

		// Year Built
		if household.YearBuilt < 1980 {
			efficiencyFactor *= 1.10
		} else if household.YearBuilt > 2015 {
			efficiencyFactor *= 0.92
		}

		// Seasonal Adjustment
		// Winter (Dec, Jan, Feb): High demand for heating
		// Summer (Jun, Jul, Aug): High demand for cooling (AC)
		if month == time.December || month == time.January || month == time.February {
			efficiencyFactor *= 1.15 // Winter premium
		} else if month == time.June || month == time.July || month == time.August {
			efficiencyFactor *= 1.10 // Summer peak (AC)
		}
	}

	// --- 5. Time Factor (PUN simulation) ---
	var timeFactor float64
	switch {
	case hour >= 23 || hour < 7:
		timeFactor = 0.75
	case hour >= 8 && hour < 12:
		timeFactor = 1.30
	case hour >= 19 && hour < 21:
		timeFactor = 1.40
	default:
		timeFactor = 1.05
	}

	// --- 6. Weather Factor ---
	var tempFactor float64
	if temperature < 2 {
		tempFactor = 1.25 // Extreme cold
	} else if temperature > 32 {
		tempFactor = 1.20 // Heatwave
	} else if temperature >= 18 && temperature <= 24 {
		tempFactor = 0.90 // Perfect weather
	} else {
		tempFactor = 1.00
	}

	// --- 7. Consumption Factor ---
	consumptionFactor := 1.0
	if consumption > 3.0 {
		consumptionFactor = 1.15
	}

	// Total calculation
	price := basePrice * regionFactor * membersFactor * areaFactor * efficiencyFactor * timeFactor * tempFactor * consumptionFactor

	// Add market volatility
	volatility := 0.97 + (float64(time.Now().Unix()%100) / 100 * 0.06)
	price *= volatility

	// Final Formatting
	price = math.Round(price*10000) / 10000

	// Confidence calculation
	confidence := 92
	if household != nil {
		if household.Members > 5 || household.AreaSqm > 200 {
			confidence -= 4
		}
		if household.YearBuilt < 1960 {
			confidence -= 5
		}
	}
	if temperature < -5 || temperature > 40 {
		confidence -= 10
	}

	// Ensure confidence limits
	if confidence > 95 {
		confidence = 95
	}
	if confidence < 70 {
		confidence = 70
	}

	return price, confidence
}

// GenerateActualPrice simulates the real market price that occurred.
func GenerateActualPrice(predictedPrice float64, hour int) float64 {
	seed := time.Now().UnixNano()
	noise := (float64(seed%20) - 10) / 100.0 // -10% to +10% noise
	if hour >= 19 && hour <= 21 {
		if seed%10 == 0 {
			noise += 0.15
		}
	}
	actual := predictedPrice * (1 + noise)
	return math.Round(actual*10000) / 10000
}

// Get24HourForecast generates a prediction for the next 24 hours starting from now.
func Get24HourForecast(household *models.Household, currentTemp float64) []models.PredictionResponse {
	var forecast []models.PredictionResponse
	now := time.Now()

	for i := 0; i < 24; i++ {
		futureTime := now.Add(time.Duration(i) * time.Hour)
		hour := futureTime.Hour()

		// Simple temp forecast simulation (colder at night, warmer at day)
		temp := currentTemp
		if hour < 6 || hour > 21 {
			temp -= 3.0 // Night cool down
		} else if hour > 11 && hour < 16 {
			temp += 4.0 // Midday heat
		}

		// Mock consumption for the future
		mockConsumption := 0.8 // Average base
		if hour >= 18 && hour <= 22 {
			mockConsumption = 2.5
		} // Evening usage

		price, conf := PredictPrice(household, hour, temp, mockConsumption)

		forecast = append(forecast, models.PredictionResponse{
			Timestamp:      futureTime.Format(time.RFC3339),
			Hour:           hour,
			Temperature:    temp,
			PredictedPrice: price,
			Confidence:     conf,
		})
	}
	return forecast
}

func GetPriceCategory(price float64) string {
	switch {
	case price < 0.08:
		return "very_low"
	case price < 0.10:
		return "low"
	case price < 0.12:
		return "normal"
	case price < 0.14:
		return "high"
	default:
		return "very_high"
	}
}

func GetOptimalHours(household *models.Household, temperature float64, consumption float64) []int {
	type hourPrice struct {
		hour  int
		price float64
	}
	prices := make([]hourPrice, 24)
	for h := 0; h < 24; h++ {
		price, _ := PredictPrice(household, h, temperature, consumption)
		prices[h] = hourPrice{hour: h, price: price}
	}
	for i := 0; i < len(prices)-1; i++ {
		for j := i + 1; j < len(prices); j++ {
			if prices[j].price < prices[i].price {
				prices[i], prices[j] = prices[j], prices[i]
			}
		}
	}
	result := make([]int, 5)
	for i := 0; i < 5; i++ {
		result[i] = prices[i].hour
	}
	return result
}
