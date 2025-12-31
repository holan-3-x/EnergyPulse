// MQTT Simulator - Simulates 20 smart meters publishing energy data.
// This demonstrates MQTT publish/subscribe pattern from the course lectures.
package main

import (
	"bytes"
	"encoding/json"
	"energy-prediction/internal/database"
	"energy-prediction/internal/models"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

// MeterData represents data from a smart meter
type MeterData struct {
	MeterID        string  `json:"meterId"`
	Timestamp      string  `json:"timestamp"`
	Temperature    float64 `json:"temperature"`
	ConsumptionKwh float64 `json:"consumptionKwh"`
}

const (
	numMeters       = 20
	publishInterval = 30 * time.Second // Publish every 30 seconds
)

func main() {
	log.Println("========================================")
	log.Println("  EnergyPulse - Smart Meter Simulator")
	log.Println("  Simulating 20 IoT Smart Meters")
	log.Println("========================================")

	// Get broker URL from environment
	brokerURL := os.Getenv("MQTT_BROKER")
	if brokerURL == "" {
		brokerURL = "tcp://localhost:1883"
	}

	// Configure MQTT client
	opts := mqtt.NewClientOptions()
	opts.AddBroker(brokerURL)
	opts.SetClientID("energy-meter-simulator")
	opts.SetCleanSession(true)
	opts.SetAutoReconnect(true)
	opts.SetConnectionLostHandler(func(c mqtt.Client, err error) {
		log.Printf("Connection lost: %v", err)
	})
	opts.SetOnConnectHandler(func(c mqtt.Client) {
		log.Printf("✓ Connected to MQTT broker: %s", brokerURL)
	})

	// Create and connect client
	client := mqtt.NewClient(opts)
	log.Printf("Connecting to MQTT broker: %s", brokerURL)

	// Connect to broker (optional, fallback to HTTP)
	token := client.Connect()
	if token.Wait() && token.Error() != nil {
		log.Printf("Warning: Failed to connect to MQTT: %v", token.Error())
		log.Println("Will use HTTP simulation instead.")
	} else {
		log.Printf("✓ Connected to MQTT broker: %s", brokerURL)
	}

	// Connect to database to get real houses
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "data/energy.db"
	}
	if err := database.Connect(dbPath); err != nil {
		log.Printf("Warning: Could not connect to database: %v", err)
		log.Println("Will use default hardcoded meter IDs instead.")
	} else {
		log.Println("✓ Connected to database, fetching houses...")
	}
	defer database.Close()

	// Set up graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Create ticker for publishing
	ticker := time.NewTicker(publishInterval)
	defer ticker.Stop()

	log.Println("")
	log.Printf("Simulating smart meters every %v", publishInterval)
	log.Println("Press Ctrl+C to stop")
	log.Println("")

	// Publish initial data immediately
	publishAllMeters(client)

	// Main loop
	for {
		select {
		case <-ticker.C:
			publishAllMeters(client)
		case <-quit:
			log.Println("\nShutting down simulator...")
			client.Disconnect(1000)
			log.Println("Simulator stopped.")
			return
		}
	}
}

// publishAllMeters sends data for real houses in the database
func publishAllMeters(client mqtt.Client) {
	now := time.Now()
	hour := now.Hour()

	var meterIDs []string

	// Try to get meter IDs from database
	if database.DB != nil {
		var households []models.Household
		// Only simulate houses that are ACTIVE
		if err := database.DB.Select("meter_id").Where("status = ?", "active").Find(&households).Error; err == nil {
			for _, h := range households {
				if h.MeterID != "" {
					meterIDs = append(meterIDs, h.MeterID)
				}
			}
		}
	}

	// Fallback if DB empty or unavailable
	if len(meterIDs) == 0 {
		log.Println("No houses found in database, using defaults.")
		for i := 1; i <= 5; i++ {
			meterIDs = append(meterIDs, fmt.Sprintf("household_%d", i))
		}
	}

	log.Printf("Publishing data for %d houses...", len(meterIDs))

	for _, meterID := range meterIDs {
		data := generateMeterData(meterID, now, hour)

		// Serialize to JSON
		payload, err := json.Marshal(data)
		if err != nil {
			log.Printf("Failed to serialize data for %s: %v", meterID, err)
			continue
		}

		// Publish to topic: energy/meters/{meterId}
		if client.IsConnected() {
			topic := fmt.Sprintf("energy/meters/%s", meterID)
			token := client.Publish(topic, 1, false, payload)
			token.Wait()

			if token.Error() != nil {
				log.Printf("Failed to publish to %s: %v", topic, token.Error())
			} else {
				log.Printf("MQTT Published: %s -> %.2f kWh, %.1f°C", meterID, data.ConsumptionKwh, data.Temperature)
			}
		} else {
			// Fallback: Send via HTTP
			// Note: In production we'd put the URL in env var
			resp, err := http.Post("http://localhost:8080/api/simulate", "application/json", bytes.NewBuffer(payload))
			if err != nil {
				log.Printf("HTTP Failed to send data for %s: %v", meterID, err)
			} else {
				resp.Body.Close()
				log.Printf("HTTP Sent: %s -> %.2f kWh, %.1f°C", meterID, data.ConsumptionKwh, data.Temperature)
			}
		}
	}
	log.Println("---")
}

// generateMeterData creates realistic meter data
func generateMeterData(meterID string, timestamp time.Time, hour int) MeterData {
	// Base consumption by hour (Italian household patterns)
	var baseConsumption float64
	switch {
	case hour >= 0 && hour < 6:
		baseConsumption = 0.2 // Night: minimal
	case hour >= 6 && hour < 9:
		baseConsumption = 1.5 // Morning rush
	case hour >= 9 && hour < 12:
		baseConsumption = 0.8 // Work hours
	case hour >= 12 && hour < 14:
		baseConsumption = 1.2 // Lunch
	case hour >= 14 && hour < 18:
		baseConsumption = 0.7 // Afternoon
	case hour >= 18 && hour < 21:
		baseConsumption = 1.9 // Evening peak
	default:
		baseConsumption = 0.5 // Late evening
	}

	// Add variance (+/- 30%)
	variance := 0.7 + rand.Float64()*0.6
	consumption := baseConsumption * variance

	// Temperature based on hour and season (simulated December)
	baseTemp := 8.0 // December average in northern Italy
	hourVariance := float64(hour%12) - 6
	temp := baseTemp + hourVariance + (rand.Float64()*4 - 2)

	return MeterData{
		MeterID:        meterID,
		Timestamp:      timestamp.Format(time.RFC3339),
		Temperature:    float64(int(temp*10)) / 10, // Round to 1 decimal
		ConsumptionKwh: float64(int(consumption*100)) / 100,
	}
}

// estimatePrice provides a rough price estimate for logging
func estimatePrice(hour int, temp float64) float64 {
	base := 0.10
	var timeFactor float64

	switch {
	case hour >= 23 || hour < 7:
		timeFactor = 0.80
	case hour >= 19 && hour < 21:
		timeFactor = 1.25
	case hour >= 8 && hour < 12:
		timeFactor = 1.20
	default:
		timeFactor = 1.00
	}

	tempFactor := 1.0
	if temp < 5 {
		tempFactor = 1.15
	}

	return base * timeFactor * tempFactor
}
