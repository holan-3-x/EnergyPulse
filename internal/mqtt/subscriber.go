// Package mqtt handles MQTT communication for IoT smart meter data.
// MQTT (Message Queuing Telemetry Transport) is a lightweight pub/sub protocol
// ideal for IoT devices with limited resources.
package mqtt

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"energy-prediction/internal/blockchain"
	"energy-prediction/internal/database"
	"energy-prediction/internal/ml"
	"energy-prediction/internal/models"
	pahomqtt "github.com/eclipse/paho.mqtt.golang"
)

// Client wraps the Paho MQTT client
type Client struct {
	client pahomqtt.Client
	topic  string
}

// MeterData represents data received from a smart meter
type MeterData struct {
	MeterID        string  `json:"meterId"`
	Timestamp      string  `json:"timestamp"`
	Temperature    float64 `json:"temperature"`
	ConsumptionKwh float64 `json:"consumptionKwh"`
}

// NewSubscriber creates a new MQTT subscriber client.
// It connects to the broker and subscribes to the energy data topic.
func NewSubscriber() (*Client, error) {
	// Get broker URL from environment or use default
	brokerURL := os.Getenv("MQTT_BROKER")
	if brokerURL == "" {
		brokerURL = "tcp://localhost:1883"
	}

	topic := os.Getenv("MQTT_TOPIC")
	if topic == "" {
		topic = "energy/meters/+"  // + is wildcard for any meter
	}

	// Configure MQTT client options
	opts := pahomqtt.NewClientOptions()
	opts.AddBroker(brokerURL)
	opts.SetClientID("energy-prediction-subscriber")
	opts.SetCleanSession(true)
	opts.SetAutoReconnect(true)
	opts.SetConnectionLostHandler(onConnectionLost)
	opts.SetOnConnectHandler(func(c pahomqtt.Client) {
		log.Println("✓ MQTT connected, subscribing to topic:", topic)
		subscribeToTopic(c, topic)
	})

	// Create and connect client
	client := pahomqtt.NewClient(opts)
	token := client.Connect()
	if token.Wait() && token.Error() != nil {
		return nil, fmt.Errorf("failed to connect to MQTT broker: %w", token.Error())
	}

	return &Client{
		client: client,
		topic:  topic,
	}, nil
}

// subscribeToTopic subscribes to the meter data topic with QoS 1
func subscribeToTopic(client pahomqtt.Client, topic string) {
	token := client.Subscribe(topic, 1, handleMeterData)
	if token.Wait() && token.Error() != nil {
		log.Printf("Failed to subscribe to topic %s: %v", topic, token.Error())
	} else {
		log.Printf("✓ Subscribed to topic: %s", topic)
	}
}

// onConnectionLost handles MQTT disconnection
func onConnectionLost(client pahomqtt.Client, err error) {
	log.Printf("MQTT connection lost: %v", err)
}

// handleMeterData processes incoming messages from smart meters.
// This is the core handler that:
// 1. Parses the meter data
// 2. Uses ML to predict the energy price
// 3. Logs the prediction to the blockchain
// 4. Saves everything to the database
func handleMeterData(client pahomqtt.Client, msg pahomqtt.Message) {
	log.Printf("Received message from topic %s", msg.Topic())

	// Parse meter data
	var data MeterData
	if err := json.Unmarshal(msg.Payload(), &data); err != nil {
		log.Printf("Failed to parse meter data: %v", err)
		return
	}

	// Find the household associated with this meter
	var household models.Household
	if err := database.DB.Where("meter_id = ?", data.MeterID).First(&household).Error; err != nil {
		log.Printf("Unknown meter ID: %s", data.MeterID)
		return
	}

	// Parse timestamp
	timestamp, err := time.Parse(time.RFC3339, data.Timestamp)
	if err != nil {
		timestamp = time.Now()
	}

	// Use ML model to predict price
	predictedPrice, confidence := ml.PredictPrice(
		timestamp.Hour(),
		data.Temperature,
		data.ConsumptionKwh,
	)

	// Create prediction record
	prediction := models.Prediction{
		UserID:         household.UserID,
		HouseID:        household.ID,
		MeterID:        data.MeterID,
		Timestamp:      timestamp,
		Hour:           timestamp.Hour(),
		Temperature:    data.Temperature,
		ConsumptionKwh: data.ConsumptionKwh,
		PredictedPrice: predictedPrice,
		Confidence:     confidence,
	}

	// Save to database first
	if err := database.DB.Create(&prediction).Error; err != nil {
		log.Printf("Failed to save prediction: %v", err)
		return
	}

	// Log to blockchain (async)
	go func() {
		txHash, err := blockchain.LogPrediction(&prediction)
		if err != nil {
			log.Printf("Failed to log to blockchain: %v", err)
			return
		}

		// Update prediction with blockchain transaction
		database.DB.Model(&prediction).Updates(map[string]interface{}{
			"blockchain_tx":        txHash,
			"blockchain_confirmed": true,
		})
		log.Printf("✓ Prediction %d logged to blockchain: %s", prediction.ID, txHash)
	}()

	log.Printf("✓ Prediction created: Meter=%s, Price=€%.4f, Confidence=%d%%",
		data.MeterID, predictedPrice, confidence)
}

// Disconnect cleanly closes the MQTT connection
func (c *Client) Disconnect() {
	c.client.Disconnect(1000) // Wait 1 second for pending messages
	log.Println("MQTT client disconnected")
}

// IsConnected returns whether the client is connected to the broker
func (c *Client) IsConnected() bool {
	return c.client.IsConnected()
}
