package database

import (
	"fmt"
	"log"
	"time"

	"energy-prediction/internal/models"

	"golang.org/x/crypto/bcrypt"
)

// SeedDummyData populates the database with realistic Italian demo data.
func SeedDummyData() error {
	log.Println("Checking for existing data...")

	// Check if data already exists
	var count int64
	DB.Model(&models.User{}).Count(&count)
	if count > 0 {
		log.Println("✓ Data already exists, skipping seed")
		return nil
	}

	log.Println("Seeding Italian demo data...")

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
		FirstName:    "Marco",
		LastName:     "Amministratore",
		Phone:        "+39 02 1234 5678",
		Role:         models.RoleAdmin,
	}
	if err := DB.Create(&admin).Error; err != nil {
		return fmt.Errorf("failed to create admin: %w", err)
	}

	// ========== 2. CREATE REGULAR ITALIAN USERS ==========
	usersData := []struct {
		username  string
		email     string
		firstName string
		lastName  string
		phone     string
	}{
		{"mario", "mario.rossi@email.it", "Mario", "Rossi", "+39 06 9876 5432"},
		{"giulia", "giulia.bianchi@email.it", "Giulia", "Bianchi", "+39 055 1234 567"},
		{"luca", "luca.ferrari@email.it", "Luca", "Ferrari", "+39 011 9876 543"},
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

	log.Printf("✓ Created 4 users (1 admin + 3 regular)")

	// ========== 3. CREATE ITALIAN HOUSEHOLDS ==========
	// Italian household data with realistic addresses
	housesData := []struct {
		userIdx     int // 0=admin, 1=mario, 2=giulia, 3=luca
		isAdmin     bool
		houseName   string
		address     string
		city        string
		region      string
		members     int
		heatingType models.HeatingType
		areaSqm     float64
		yearBuilt   int
	}{
		// Admin's house (Milano)
		{-1, true, "Appartamento Centro", "Via Montenapoleone 15", "Milano", "Lombardia", 2, models.HeatingGas, 95, 1985},

		// Mario's houses (Roma)
		{0, false, "Casa Roma Centro", "Via del Corso 120", "Roma", "Lazio", 4, models.HeatingGas, 110, 1970},
		{0, false, "Appartamento Trastevere", "Via della Lungaretta 45", "Roma", "Lazio", 2, models.HeatingElectric, 65, 2005},

		// Giulia's houses (Firenze)
		{1, false, "Villa Fiorentina", "Viale Michelangelo 32", "Firenze", "Toscana", 3, models.HeatingHeatPump, 140, 2010},
		{1, false, "Appartamento Centro Storico", "Via dei Calzaiuoli 18", "Firenze", "Toscana", 2, models.HeatingGas, 80, 1920},

		// Luca's house (Torino)
		{2, false, "Casa Torino", "Corso Vittorio Emanuele II 88", "Torino", "Piemonte", 3, models.HeatingGas, 95, 1990},
	}

	meterCount := 1
	for idx, h := range housesData {
		var userID uint
		if h.isAdmin {
			userID = admin.ID
		} else {
			userID = users[h.userIdx].ID
		}

		house := models.Household{
			ID:          fmt.Sprintf("house_%03d", idx+1),
			UserID:      userID,
			HouseName:   h.houseName,
			Address:     h.address,
			City:        h.city,
			Region:      h.region,
			Country:     "Italia",
			Members:     h.members,
			HeatingType: h.heatingType,
			AreaSqm:     h.areaSqm,
			YearBuilt:   h.yearBuilt,
			MeterID:     fmt.Sprintf("household_%d", meterCount),
			Status:      models.StatusActive,
		}
		meterCount++
		if err := DB.Create(&house).Error; err != nil {
			return fmt.Errorf("failed to create house: %w", err)
		}
	}

	log.Printf("✓ Created %d Italian households", len(housesData))

	// ========== 4. CREATE PREDICTIONS (3 days of hourly data) ==========
	now := time.Now()
	startTime := now.Add(-time.Hour * 72) // 3 days ago

	predictionsCreated := 0

	// Realistic Italian energy prices (€/kWh) based on time of day
	getPriceForHour := func(hour int) float64 {
		switch {
		case hour >= 23 || hour < 7: // Night (F3)
			return 0.18 + float64(hour%3)*0.01
		case hour >= 7 && hour < 8: // Morning start
			return 0.22 + float64(hour%2)*0.01
		case hour >= 8 && hour < 19: // Peak hours (F1)
			return 0.28 + float64(hour%5)*0.02
		case hour >= 19 && hour < 23: // Evening (F2)
			return 0.24 + float64(hour%3)*0.01
		default:
			return 0.22
		}
	}

	// Typical Italian household consumption (kWh) by hour
	getConsumption := func(hour int) float64 {
		switch {
		case hour >= 0 && hour < 6:
			return 0.3 // Night: standby
		case hour >= 6 && hour < 8:
			return 1.2 // Morning wake
		case hour >= 8 && hour < 12:
			return 0.6 // Work hours
		case hour >= 12 && hour < 14:
			return 1.8 // Lunch cooking
		case hour >= 14 && hour < 18:
			return 0.5 // Afternoon
		case hour >= 18 && hour < 21:
			return 2.2 // Dinner peak
		case hour >= 21 && hour < 24:
			return 1.0 // Evening
		default:
			return 0.5
		}
	}

	// Fetch all households
	var households []models.Household
	DB.Find(&households)

	for _, house := range households {
		// Create 72 predictions per house (3 days × 24 hours)
		for i := 0; i < 72; i++ {
			predTime := startTime.Add(time.Hour * time.Duration(i))
			hour := predTime.Hour()

			// Seasonal temperature (winter in Italy)
			baseTemp := 8.0 + float64(hour%6)

			prediction := models.Prediction{
				UserID:         house.UserID,
				HouseID:        house.ID,
				MeterID:        house.MeterID,
				Timestamp:      predTime,
				Hour:           hour,
				Temperature:    baseTemp,
				ConsumptionKwh: getConsumption(hour),
				PredictedPrice: getPriceForHour(hour),
				Confidence:     88 + (i % 8),
			}

			if err := DB.Create(&prediction).Error; err != nil {
				log.Printf("Warning: failed to create prediction: %v", err)
				continue
			}
			predictionsCreated++
		}
	}

	log.Printf("✓ Created %d predictions", predictionsCreated)

	// ========== 5. CREATE BLOCKCHAIN LOGS ==========
	// Log recent predictions to simulated blockchain
	var predictions []models.Prediction
	DB.Order("created_at DESC").Limit(30).Find(&predictions)

	blockNumber := uint64(18500000) // Realistic Ethereum block
	for idx, pred := range predictions {
		txHash := fmt.Sprintf("0x%064x", time.Now().UnixNano()+int64(idx))
		confirmedAt := time.Now().Add(-time.Duration(idx) * time.Minute)

		blockchainLog := models.BlockchainLog{
			PredictionID:    pred.ID,
			TransactionHash: txHash,
			BlockNumber:     blockNumber + uint64(idx),
			GasUsed:         uint64(45000 + idx*500),
			Status:          "confirmed",
			ContractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f4e2E1",
			ConfirmedAt:     &confirmedAt,
		}

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

	log.Println("✓ Created 30 blockchain transaction logs")
	log.Println("✓ Italian demo data seeded successfully!")
	log.Println("")
	log.Println("Demo Credentials:")
	log.Println("  Admin: admin@energypulse.it / password123")
	log.Println("  User:  mario.rossi@email.it / password123")
	log.Println("  User:  giulia.bianchi@email.it / password123")
	log.Println("  User:  luca.ferrari@email.it / password123")

	return nil
}
