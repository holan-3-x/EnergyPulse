// Package ml implements the machine learning model for energy price prediction.
// For simplicity, we use a rule-based decision tree that mimics Italian market patterns.
// In production, you would train a real ML model using libraries like golearn.
package ml

import (
	"math"
)

// PredictPrice uses a decision tree approach to predict energy prices.
// Parameters:
//   - hour: Hour of the day (0-23)
//   - temperature: Outdoor temperature in Celsius
//   - consumption: Current consumption in kWh
//
// Returns:
//   - price: Predicted price in €/kWh
//   - confidence: Confidence percentage (0-100)
func PredictPrice(hour int, temperature, consumption float64) (float64, int) {
	// Base price (Italian market average)
	basePrice := 0.10 // €/kWh

	// Time Factor - Italian electricity has time-of-use pricing
	var timeFactor float64
	switch {
	case hour >= 23 || hour < 7:
		timeFactor = 0.80 // Night (F3): Cheapest
	case hour >= 7 && hour < 8:
		timeFactor = 0.95 // Early morning transition
	case hour >= 8 && hour < 12:
		timeFactor = 1.20 // Morning peak (F1)
	case hour >= 12 && hour < 14:
		timeFactor = 1.15 // Midday peak (F1)
	case hour >= 14 && hour < 19:
		timeFactor = 1.10 // Afternoon (F2)
	case hour >= 19 && hour < 21:
		timeFactor = 1.25 // Evening peak (F1)
	default:
		timeFactor = 1.00 // Late evening (F2)
	}

	// Temperature Factor - Extreme temperatures increase demand
	var tempFactor float64
	if temperature < 5 {
		tempFactor = 1.15 + (5-temperature)*0.02 // Cold: High heating demand
	} else if temperature > 28 {
		tempFactor = 1.10 + (temperature-28)*0.015 // Hot: High cooling demand
	} else if temperature > 18 && temperature < 24 {
		tempFactor = 0.95 // Comfortable: Lower demand
	} else {
		tempFactor = 1.00 // Moderate
	}

	// Consumption Factor - Higher consumption correlates with grid stress
	var consumptionFactor float64
	if consumption < 0.5 {
		consumptionFactor = 0.95
	} else if consumption < 1.0 {
		consumptionFactor = 1.00
	} else if consumption < 2.0 {
		consumptionFactor = 1.05
	} else {
		consumptionFactor = 1.10 + (consumption-2.0)*0.03
	}

	// Calculate Final Price
	price := basePrice * timeFactor * tempFactor * consumptionFactor

	// Add small variance for realism (-2% to +2%)
	variance := 0.98 + (float64(hour%7) * 0.01)
	price *= variance

	// Round to 4 decimal places
	price = math.Round(price*10000) / 10000

	// Calculate Confidence (base 85%)
	confidence := 85

	// Morning and evening are more predictable
	if (hour >= 8 && hour < 12) || (hour >= 18 && hour < 22) {
		confidence += 5
	}

	// Extreme conditions reduce confidence
	if temperature < 0 || temperature > 35 {
		confidence -= 5
	}

	// Normal consumption is more predictable
	if consumption >= 0.3 && consumption <= 2.5 {
		confidence += 3
	}

	// Cap confidence between 70-95
	if confidence < 70 {
		confidence = 70
	} else if confidence > 95 {
		confidence = 95
	}

	return price, confidence
}

// GetPriceCategory returns a human-readable price category.
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

// GetOptimalHours returns the best hours to use energy based on predicted prices.
func GetOptimalHours(temperature float64, consumption float64) []int {
	type hourPrice struct {
		hour  int
		price float64
	}

	// Calculate prices for all hours
	prices := make([]hourPrice, 24)
	for h := 0; h < 24; h++ {
		price, _ := PredictPrice(h, temperature, consumption)
		prices[h] = hourPrice{hour: h, price: price}
	}

	// Simple bubble sort (small array)
	for i := 0; i < len(prices)-1; i++ {
		for j := i + 1; j < len(prices); j++ {
			if prices[j].price < prices[i].price {
				prices[i], prices[j] = prices[j], prices[i]
			}
		}
	}

	// Return top 5 cheapest hours
	result := make([]int, 5)
	for i := 0; i < 5; i++ {
		result[i] = prices[i].hour
	}
	return result
}
