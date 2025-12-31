// Package models defines all data structures used in the application.
// This package demonstrates Go structs, interfaces, and GORM ORM annotations.
package models

import (
	"time"
)

// UserRole represents the access level of a user
type UserRole string

const (
	RoleAdmin UserRole = "admin"
	RoleUser  UserRole = "user"
)

// User represents a system user with authentication details.
// The struct tags configure JSON serialization and GORM database mapping.
type User struct {
	ID           uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	Username     string    `json:"username" gorm:"uniqueIndex;not null;size:50"`
	PasswordHash string    `json:"-" gorm:"not null"` // "-" excludes from JSON
	Email        string    `json:"email" gorm:"uniqueIndex;not null;size:100"`
	FirstName    string    `json:"firstName" gorm:"column:first_name;not null;size:50"`
	LastName     string    `json:"lastName" gorm:"column:last_name;not null;size:50"`
	Phone        string    `json:"phone" gorm:"size:20"`
	AvatarURL    string    `json:"avatar" gorm:"column:avatar_url;size:255"`
	Role         UserRole  `json:"role" gorm:"type:varchar(10);default:'user'"`
	CreatedAt    time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updatedAt" gorm:"autoUpdateTime"`

	// Relations - one user has many households
	Households []Household `json:"households,omitempty" gorm:"foreignKey:UserID"`
}

// TableName specifies the database table name for GORM
func (User) TableName() string {
	return "users"
}

// Session represents an active user session for JWT token management.
// This enables token revocation and tracking of active sessions.
type Session struct {
	ID        uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID    uint      `json:"userId" gorm:"index;not null"`
	Token     string    `json:"token" gorm:"uniqueIndex;not null;size:500"`
	ExpiresAt time.Time `json:"expiresAt" gorm:"not null"`
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`

	// Relation
	User User `json:"-" gorm:"foreignKey:UserID"`
}

func (Session) TableName() string {
	return "sessions"
}

// ========== Request/Response DTOs ==========
// DTOs (Data Transfer Objects) separate API contracts from database models

// RegisterRequest contains all fields needed for user registration
type RegisterRequest struct {
	// User info
	Username  string `json:"username" binding:"required,min=3,max=50"`
	Password  string `json:"password" binding:"required,min=8"`
	Email     string `json:"email" binding:"required,email"`
	FirstName string `json:"firstName" binding:"required,min=1,max=50"`
	LastName  string `json:"lastName" binding:"required,min=1,max=50"`
	Phone     string `json:"phone"`

	// House info (created during registration)
	HouseName   string  `json:"houseName" binding:"required"`
	Address     string  `json:"address" binding:"required"`
	City        string  `json:"city" binding:"required"`
	Region      string  `json:"region"`
	Country     string  `json:"country" binding:"required"`
	Members     int     `json:"members" binding:"min=1"`
	HeatingType string  `json:"heatingType"`
	AreaSqm     float64 `json:"areaSqm" binding:"min=1"`
	YearBuilt   int     `json:"yearBuilt" binding:"min=1800,max=2025"`
}

// LoginRequest contains credentials for authentication
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse returns user info and JWT token
type LoginResponse struct {
	Token     string `json:"token"`
	ExpiresAt int64  `json:"expiresAt"`
	User      User   `json:"user"`
}

// UpdateProfileRequest allows users to update their profile
type UpdateProfileRequest struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	AvatarURL string `json:"avatar"`
}

// ChangePasswordRequest validates password change
type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required,min=8"`
}

// UserResponse is a safe version of User for API responses
type UserResponse struct {
	ID        uint     `json:"id"`
	Username  string   `json:"username"`
	Email     string   `json:"email"`
	FirstName string   `json:"firstName"`
	LastName  string   `json:"lastName"`
	Phone     string   `json:"phone"`
	Avatar    string   `json:"avatar"`
	Role      UserRole `json:"role"`
}

// ToResponse converts User to UserResponse (excludes sensitive data)
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:        u.ID,
		Username:  u.Username,
		Email:     u.Email,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Phone:     u.Phone,
		Avatar:    u.AvatarURL,
		Role:      u.Role,
	}
}
