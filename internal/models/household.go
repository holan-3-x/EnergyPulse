package models

import (
	"time"
)

// HeatingType represents different heating systems
type HeatingType string

const (
	HeatingElectric HeatingType = "electric"
	HeatingGas      HeatingType = "natural_gas"
	HeatingHeatPump HeatingType = "heat_pump"
	HeatingBiomass  HeatingType = "biomass"
)

// HouseholdStatus indicates if a house is active or archived
type HouseholdStatus string

const (
	StatusActive   HouseholdStatus = "active"
	StatusArchived HouseholdStatus = "archived"
)

// Household represents a user's house with energy monitoring.
// Each household is linked to a smart meter for IoT data collection.
type Household struct {
	ID        string          `json:"id" gorm:"primaryKey;size:50"`           // Format: house_001
	UserID    uint            `json:"userId" gorm:"index;not null"`           // Foreign key
	HouseName string          `json:"houseName" gorm:"column:house_name;not null;size:100"`
	Address   string          `json:"address" gorm:"not null;size:200"`
	City      string          `json:"city" gorm:"not null;size:100"`
	Region    string          `json:"region" gorm:"size:100"`
	Country   string          `json:"country" gorm:"not null;size:100"`
	Members   int             `json:"members" gorm:"column:household_members;default:1"`
	HeatingType HeatingType   `json:"heatingType" gorm:"column:heating_type;type:varchar(20)"`
	AreaSqm   float64         `json:"areaSqm" gorm:"column:area_sqm"`
	YearBuilt int             `json:"yearBuilt" gorm:"column:year_built"`
	MeterID   string          `json:"meterId" gorm:"column:meter_id;uniqueIndex;size:50"` // Format: household_1
	Status    HouseholdStatus `json:"status" gorm:"type:varchar(20);default:'active'"`
	CreatedAt time.Time       `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time       `json:"updatedAt" gorm:"autoUpdateTime"`

	// Relations
	User        User         `json:"-" gorm:"foreignKey:UserID"`
	Predictions []Prediction `json:"predictions,omitempty" gorm:"foreignKey:HouseID"`
}

func (Household) TableName() string {
	return "households"
}

// ========== Request/Response DTOs ==========

// CreateHouseRequest for adding a new house
type CreateHouseRequest struct {
	HouseName   string      `json:"houseName" binding:"required"`
	Address     string      `json:"address" binding:"required"`
	City        string      `json:"city" binding:"required"`
	Region      string      `json:"region"`
	Country     string      `json:"country" binding:"required"`
	Members     int         `json:"members" binding:"min=1"`
	HeatingType HeatingType `json:"heatingType"`
	AreaSqm     float64     `json:"areaSqm" binding:"min=1"`
	YearBuilt   int         `json:"yearBuilt" binding:"min=1800,max=2025"`
}

// UpdateHouseRequest for modifying house details
type UpdateHouseRequest struct {
	HouseName   string      `json:"houseName"`
	Address     string      `json:"address"`
	City        string      `json:"city"`
	Region      string      `json:"region"`
	Country     string      `json:"country"`
	Members     int         `json:"members"`
	HeatingType HeatingType `json:"heatingType"`
	AreaSqm     float64     `json:"areaSqm"`
	YearBuilt   int         `json:"yearBuilt"`
}

// HouseholdResponse is the API response format
type HouseholdResponse struct {
	ID          string          `json:"id"`
	UserID      uint            `json:"userId"`
	HouseName   string          `json:"houseName"`
	Address     string          `json:"address"`
	City        string          `json:"city"`
	Region      string          `json:"region"`
	Country     string          `json:"country"`
	Members     int             `json:"members"`
	HeatingType HeatingType     `json:"heatingType"`
	AreaSqm     float64         `json:"areaSqm"`
	YearBuilt   int             `json:"yearBuilt"`
	MeterID     string          `json:"meterId"`
	Status      HouseholdStatus `json:"status"`
	CreatedAt   time.Time       `json:"createdAt"`
}

// ToResponse converts Household to HouseholdResponse
func (h *Household) ToResponse() HouseholdResponse {
	return HouseholdResponse{
		ID:          h.ID,
		UserID:      h.UserID,
		HouseName:   h.HouseName,
		Address:     h.Address,
		City:        h.City,
		Region:      h.Region,
		Country:     h.Country,
		Members:     h.Members,
		HeatingType: h.HeatingType,
		AreaSqm:     h.AreaSqm,
		YearBuilt:   h.YearBuilt,
		MeterID:     h.MeterID,
		Status:      h.Status,
		CreatedAt:   h.CreatedAt,
	}
}
