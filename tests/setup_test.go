package tests

import (
	"fmt"
	"os"
	"time"

	"energy-prediction/internal/database"
	"energy-prediction/internal/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var testDB *gorm.DB

func SetupTestDB() {
	dbName := fmt.Sprintf("test_%d.db", time.Now().UnixNano())
	db, err := gorm.Open(sqlite.Open(dbName), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}

	// Migrate the schema
	db.AutoMigrate(&models.User{}, &models.Household{}, &models.Prediction{}, &models.Session{})

	testDB = db
	database.DB = db
}

func TeardownTestDB() {
	if testDB != nil {
		sqlDB, _ := testDB.DB()
		sqlDB.Close()
		os.Remove(testDB.Name()) // This might not work directly with GORM's name if it's complex, better to track filename
	}
}
