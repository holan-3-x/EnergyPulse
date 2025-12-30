package database

import (
	"fmt"
	"log"
	"time"

	"energy-prediction/internal/models"
	"golang.org/x/crypto/bcrypt"
)

// SeedDummyData populates the database with realistic demo data.
// This is useful for demonstrations and testing.
func SeedDummyData() error {
	log.Println("Checking for existing data...")

	// Check if data already exists
	var count int64
	DB.Model(&models.User{}).Count(&count)
	if count > 0 {
		log.Println("✓ Dummy data already exists, skipping seed")
		return nil
	}

	log.Println("Seeding dummy data...")

	// Hash password for all demo users (password: "password123")
	passwordHash, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// ========== 1. CREATE ADMIN USER ==========
	admin := models.User{
		Username:     "admin",
		PasswordHash: string(passwordHash),
		Email:        "admin@energypulse.it",
		FirstName:    "Admin",
		LastName:     "User",
		Phone:        "+39 123 456 7890",
		Role:         models.RoleAdmin,
	}
	if err := DB.Create(&admin).Error; err != nil {
		return fmt.Errorf("failed to create admin: %w", err)
	}

	// ========== 2. CREATE REGULAR USERS ==========
	usersData := []struct {
		username  string
		email     string
		firstName string
		lastName  string
		phone     string
	}{
		{"mario", "mario@example.it", "Mario", "Rossi", "+39 123 456 7891"},
		{"luigi", "luigi@example.it", "Luigi", "Verdi", "+39 123 456 7892"},
		{"anna", "anna@example.it", "Anna", "Bianchi", "+39 123 456 7893"},
		{"giorgio", "giorgio@example.it", "Giorgio", "Ferrari", "+39 123 456 7894"},
		{"francesca", "francesca@example.it", "Francesca", "Russo", "+39 123 456 7895"},
	}

	users := make([]models.User, 0, len(usersData))
	for _, u := range usersData {
		user := models.User{
			Username:     u.username,
			PasswordHash: string(passwordHash),
			Email:        u.email,
			FirstName:    u.firstName,
			LastName:     u.lastName,
			Phone:        u.phone,
			Role:         models.RoleUser,
		}
		if err := DB.Create(&user).Error; err != nil {
			return fmt.Errorf("failed to create user %s: %w", u.username, err)
		}
		users = append(users, user)
	}

	log.Printf("✓ Created 6 users (1 admin + 5 regular)")

	// ========== 3. CREATE HOUSEHOLDS (20 total for smart meters) ==========
	cities := []string{"Milano", "Roma", "Torino", "Firenze", "Bologna", "Napoli", "Palermo", "Genova"}
	heatingTypes := []models.HeatingType{models.HeatingGas, models.HeatingElectric, models.HeatingHeatPump, models.HeatingBiomass}

	houseCount := 0
	meterCount := 1

	// Admin gets 3 houses
	for i := 1; i <= 3; i++ {
		houseCount++
		house := models.Household{
			ID:          fmt.Sprintf("house_%03d", houseCount),
			UserID:      admin.ID,
			HouseName:   fmt.Sprintf("Casa Admin %d", i),
			Address:     fmt.Sprintf("Via Roma %d", i*10),
			City:        "Milano",
			Region:      "Lombardy",
			Country:     "Italy",
			Members:     3,
			HeatingType: heatingTypes[i%len(heatingTypes)],
			AreaSqm:     float64(85 + i*10),
			YearBuilt:   2010 + i,
			MeterID:     fmt.Sprintf("household_%d", meterCount),
			Status:      models.StatusActive,
		}
		meterCount++
		if err := DB.Create(&house).Error; err != nil {
			return fmt.Errorf("failed to create house: %w", err)
		}
	}

	// Distribute remaining 17 houses across users
	housesPerUser := []int{4, 4, 3, 3, 3} // = 17 total
	for userIdx, user := range users {
		numHouses := housesPerUser[userIdx]
		for i := 1; i <= numHouses; i++ {
			houseCount++
			city := cities[(houseCount-1)%len(cities)]
			house := models.Household{
				ID:          fmt.Sprintf("house_%03d", houseCount),
				UserID:      user.ID,
				HouseName:   fmt.Sprintf("Casa %s %d", user.FirstName, i),
				Address:     fmt.Sprintf("Via %s %d", city, i*10),
				City:        city,
				Region:      "Various",
				Country:     "Italy",
				Members:     2 + (i % 3),
				HeatingType: heatingTypes[(houseCount-1)%len(heatingTypes)],
				AreaSqm:     float64(75 + i*5),
				YearBuilt:   2000 + i*2,
				MeterID:     fmt.Sprintf("household_%d", meterCount),
				Status:      models.StatusActive,
			}
			meterCount++
			if err := DB.Create(&house).Error; err != nil {
				return fmt.Errorf("failed to create house: %w", err)
			}
		}
	}

	log.Printf("✓ Created %d households (20 smart meters)", houseCount)

	// ========== 4. CREATE PREDICTIONS (5 days of hourly data per household) ==========
	now := time.Now()
	startTime := now.Add(-time.Hour * 120) // 5 days ago

	predictionsCreated := 0

	// Helper functions for realistic Italian data
	getPriceForHour := func(hour int) float64 {
		// Italian market prices (€/kWh)
		if hour >= 23 || hour < 7 {
			return 0.08 + float64(hour%3)*0.01 // Night: cheaper
		} else if hour >= 7 && hour < 11 {
			return 0.10 + float64(hour%4)*0.01 // Morning peak
		} else if hour >= 11 && hour < 15 {
			return 0.12 + float64(hour%5)*0.01 // Midday: expensive
		} else {
			return 0.09 + float64(hour%4)*0.01 // Afternoon
		}
	}

	getConsumption := func(hour int) float64 {
		// Typical Italian household consumption (kWh)
		if hour >= 0 && hour < 6 {
			return 0.2 // Night: minimal
		} else if hour >= 7 && hour < 9 {
			return 1.5 // Morning rush
		} else if hour >= 9 && hour < 12 {
			return 0.8 // Work hours
		} else if hour >= 12 && hour < 18 {
			return 0.9 // Afternoon
		} else if hour >= 18 && hour < 21 {
			return 1.9 // Evening peak
		} else {
			return 0.5 // Late evening
		}
	}

	// Fetch all households
	var households []models.Household
	DB.Find(&households)

	for _, house := range households {
		// Create 120 predictions per house (5 days × 24 hours)
		for i := 0; i < 120; i++ {
			predTime := startTime.Add(time.Hour * time.Duration(i))
			hour := predTime.Hour()
			temp := 15.0 + float64(hour%8) + float64(i%30)/10.0

			prediction := models.Prediction{
				UserID:         house.UserID,
				HouseID:        house.ID,
				MeterID:        house.MeterID,
				Timestamp:      predTime,
				Hour:           hour,
				Temperature:    temp,
				ConsumptionKwh: getConsumption(hour),
				PredictedPrice: getPriceForHour(hour),
				Confidence:     85 + (i % 10),
			}

			if err := DB.Create(&prediction).Error; err != nil {
				log.Printf("Warning: failed to create prediction: %v", err)
				continue
			}
			predictionsCreated++
		}
	}

	log.Printf("✓ Created %d predictions", predictionsCreated)

	// ========== 5. SIMULATE BLOCKCHAIN TRANSACTIONS ==========
	// Log first 50 predictions to simulated blockchain
	var predictions []models.Prediction
	DB.Limit(50).Find(&predictions)

	for idx, pred := range predictions {
		txHash := fmt.Sprintf("0x%064x", idx+1) // Simulated tx hash
		blockchainLog := models.BlockchainLog{
			PredictionID:    pred.ID,
			TransactionHash: txHash,
			BlockNumber:     uint64(15000000 + idx),
			GasUsed:         uint64(21000 + idx*100),
			Status:          "confirmed",
			ContractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f4e2E1",
		}
		confirmedAt := time.Now()
		blockchainLog.ConfirmedAt = &confirmedAt

		if err := DB.Create(&blockchainLog).Error; err != nil {
			log.Printf("Warning: failed to create blockchain log: %v", err)
			continue
		}

		// Update prediction with tx hash
		DB.Model(&pred).Updates(map[string]interface{}{
			"blockchain_tx":        txHash,
			"blockchain_confirmed": true,
		})
	}

	log.Println("✓ Created 50 blockchain transaction logs")
	log.Println("✓ Dummy data seeded successfully!")

	return nil
}
