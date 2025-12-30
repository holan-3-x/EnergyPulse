// Package database handles SQLite database connection and migrations using GORM.
// GORM is an ORM (Object Relational Mapping) library that simplifies database operations.
package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"energy-prediction/internal/models"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB is the global database connection pool
var DB *gorm.DB

// Connect initializes the database connection.
// Parameters:
//   - dbPath: Path to the SQLite database file
//
// Returns error if connection fails.
func Connect(dbPath string) error {
	// Ensure data directory exists
	if err := os.MkdirAll("data", 0755); err != nil {
		return fmt.Errorf("failed to create data directory: %w", err)
	}

	// Configure GORM logger
	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Info,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	// Open SQLite database
	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: newLogger,
	})
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Get underlying sql.DB for connection pool configuration
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}

	// Configure connection pool
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("✓ Database connected successfully")
	return nil
}

// AutoMigrate creates/updates all database tables based on model structs.
// GORM automatically creates tables, columns, and indexes.
func AutoMigrate() error {
	log.Println("Running database migrations...")

	err := DB.AutoMigrate(
		&models.User{},
		&models.Session{},
		&models.Household{},
		&models.Prediction{},
		&models.BlockchainLog{},
	)
	if err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}

	log.Println("✓ Database migrations completed")
	return nil
}

// Close terminates the database connection gracefully
func Close() error {
	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// GetDB returns the database instance (useful for handlers)
func GetDB() *gorm.DB {
	return DB
}
