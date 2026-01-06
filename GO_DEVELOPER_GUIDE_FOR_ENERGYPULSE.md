# Go Developer Guide for EnergyPulse Project
## Master Your Code for the Exam Demo

This guide will teach you how to confidently modify, debug, and explain your EnergyPulse codebase during the exam.

---

## 📚 TABLE OF CONTENTS

1. [Project Architecture Overview](#1-project-architecture-overview)
2. [Understanding Handlers](#2-understanding-handlers)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [API Design & Routing](#4-api-design--routing)
5. [Database Operations](#5-database-operations)
6. [MQTT Integration](#6-mqtt-integration)
7. [Common Modifications You Might Be Asked](#7-common-modifications-you-might-be-asked)
8. [Debugging & Testing](#8-debugging--testing)

---

## 1. PROJECT ARCHITECTURE OVERVIEW

### Your Project Structure
```
EnergyPulse/
├── cmd/
│   ├── api-gateway/          # Main API server entry point
│   └── simulator/            # MQTT meter simulator
├── internal/
│   ├── auth/                 # JWT token generation & validation
│   ├── blockchain/           # Transaction hashing & verification
│   ├── handlers/             # HTTP request handlers (controllers)
│   ├── middleware/           # JWT auth & RBAC middleware
│   ├── models/               # Data structures (structs)
│   ├── mqtt/                 # MQTT client & subscriber
│   ├── repository/           # Database operations (CRUD)
│   └── routes/               # API route definitions
└── static/                   # React frontend
```

### The Flow of a Request

```
1. HTTP Request → 2. Router → 3. Middleware → 4. Handler → 5. Repository → 6. Database
                                   ↓                ↓
                            JWT Validation    Business Logic
```

**Example:** User logs in
```
POST /api/auth/login
  ↓
routes/routes.go → Finds handler
  ↓
handlers/auth.go → Login() function
  ↓
repository/user.go → GetUserByEmail()
  ↓
SQLite database → Returns user
  ↓
auth/jwt.go → GenerateToken()
  ↓
Response with JWT token
```

---

## 2. UNDERSTANDING HANDLERS

### What is a Handler?
A handler is a **function that processes HTTP requests**. Think of it as a controller in MVC.

### Anatomy of a Handler

**File: `internal/handlers/auth.go`**

```go
func Login(c *gin.Context) {
    // 1. Parse incoming JSON request body
    var req struct {
        Email    string `json:"email"`
        Password string `json:"password"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
        return
    }
    
    // 2. Call repository to fetch user from database
    user, err := repository.GetUserByEmail(req.Email)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
        return
    }
    
    // 3. Verify password
    if !auth.CheckPassword(req.Password, user.Password) {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
        return
    }
    
    // 4. Generate JWT token
    token, err := auth.GenerateToken(user.ID, user.Role)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
        return
    }
    
    // 5. Send response
    c.JSON(http.StatusOK, gin.H{
        "token": token,
        "user": gin.H{
            "id":    user.ID,
            "email": user.Email,
            "role":  user.Role,
        },
    })
}
```

### Key Concepts

| Concept | Explanation | Example |
|---------|-------------|---------|
| `gin.Context` | Contains request/response data | `c.Param("id")`, `c.JSON()` |
| `ShouldBindJSON()` | Parse JSON body into struct | `c.ShouldBindJSON(&req)` |
| `gin.H{}` | Map for JSON responses | `gin.H{"error": "Not found"}` |
| HTTP Status Codes | 200=OK, 400=Bad Request, 401=Unauthorized, 500=Server Error | `http.StatusOK` |

---

## 3. AUTHENTICATION & AUTHORIZATION

### JWT Flow in Your Project

```
User Login
  ↓
Generate JWT (auth/jwt.go)
  ↓
Frontend stores token in localStorage
  ↓
Every API request includes: Authorization: Bearer <token>
  ↓
Middleware validates token (middleware/auth.go)
  ↓
Extract user ID & role from token
  ↓
Handler accesses user info via c.Get("userID")
```

### File: `internal/auth/jwt.go`

```go
package auth

import (
    "time"
    "github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("your-secret-key") // Load from environment in production

// Custom claims structure
type Claims struct {
    UserID uint   `json:"user_id"`
    Role   string `json:"role"`
    jwt.RegisteredClaims
}

// Generate a new JWT token
func GenerateToken(userID uint, role string) (string, error) {
    claims := Claims{
        UserID: userID,
        Role:   role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // Token valid for 24 hours
            IssuedAt:  jwt.NewNumericDate(time.Now()),
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString(jwtSecret)
}

// Validate token and extract claims
func ValidateToken(tokenString string) (*Claims, error) {
    token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
        return jwtSecret, nil
    })
    
    if err != nil {
        return nil, err
    }
    
    if claims, ok := token.Claims.(*Claims); ok && token.Valid {
        return claims, nil
    }
    
    return nil, err
}
```

### File: `internal/middleware/auth.go`

```go
package middleware

import (
    "net/http"
    "strings"
    "github.com/gin-gonic/gin"
    "your-project/internal/auth"
)

// Middleware to require valid JWT
func AuthRequired() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 1. Get Authorization header
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authorization header"})
            c.Abort()
            return
        }
        
        // 2. Extract token (format: "Bearer <token>")
        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header"})
            c.Abort()
            return
        }
        
        tokenString := parts[1]
        
        // 3. Validate token
        claims, err := auth.ValidateToken(tokenString)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
            c.Abort()
            return
        }
        
        // 4. Store user info in context for handlers to use
        c.Set("userID", claims.UserID)
        c.Set("userRole", claims.Role)
        
        // 5. Continue to next handler
        c.Next()
    }
}

// Middleware to require admin role
func AdminOnly() gin.HandlerFunc {
    return func(c *gin.Context) {
        role, exists := c.Get("userRole")
        if !exists || role != "admin" {
            c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
            c.Abort()
            return
        }
        
        c.Next()
    }
}
```

### Using Middleware in Routes

**File: `internal/routes/routes.go`**

```go
func SetupRoutes(r *gin.Engine) {
    api := r.Group("/api")
    
    // Public routes (no auth required)
    api.POST("/auth/login", handlers.Login)
    api.POST("/auth/register", handlers.Register)
    
    // Protected routes (auth required)
    protected := api.Group("/")
    protected.Use(middleware.AuthRequired())
    {
        protected.GET("/houses", handlers.GetHouses)
        protected.POST("/houses", handlers.CreateHouse)
    }
    
    // Admin-only routes
    admin := api.Group("/admin")
    admin.Use(middleware.AuthRequired(), middleware.AdminOnly())
    {
        admin.GET("/users", handlers.GetAllUsers)
        admin.DELETE("/users/:id", handlers.DeleteUser)
    }
}
```

---

## 4. API DESIGN & ROUTING

### RESTful Conventions

| HTTP Method | Purpose | Example | Handler Function |
|-------------|---------|---------|------------------|
| GET | Retrieve data | `GET /api/houses` | `GetHouses()` |
| POST | Create new | `POST /api/houses` | `CreateHouse()` |
| PUT | Update entire | `PUT /api/houses/1` | `UpdateHouse()` |
| PATCH | Update partial | `PATCH /api/houses/1` | `PatchHouse()` |
| DELETE | Remove | `DELETE /api/houses/1` | `DeleteHouse()` |

### URL Parameters vs Query Parameters

```go
// URL Parameter: /api/houses/:id
func GetHouse(c *gin.Context) {
    id := c.Param("id") // Gets "123" from /api/houses/123
    // ...
}

// Query Parameter: /api/houses?city=Florence&limit=10
func GetHouses(c *gin.Context) {
    city := c.Query("city")        // Gets "Florence"
    limit := c.DefaultQuery("limit", "20") // Gets "10" or default "20"
    // ...
}
```

### Request Body Binding

```go
type CreateHouseRequest struct {
    Address  string  `json:"address" binding:"required"`
    City     string  `json:"city" binding:"required"`
    Latitude float64 `json:"latitude" binding:"required"`
    Longitude float64 `json:"longitude"`
}

func CreateHouse(c *gin.Context) {
    var req CreateHouseRequest
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Now req contains validated data
    house := models.House{
        Address: req.Address,
        City:    req.City,
        // ...
    }
}
```

---

## 5. DATABASE OPERATIONS

### Repository Pattern

Your project uses the **Repository Pattern** to separate database logic from business logic.

```
Handler (Business Logic)
    ↓
Repository (Database Operations)
    ↓
SQLite Database
```

### File: `internal/repository/house.go`

```go
package repository

import (
    "database/sql"
    "your-project/internal/models"
)

// Create a new house
func CreateHouse(db *sql.DB, house *models.House) error {
    query := `
        INSERT INTO houses (user_id, address, city, latitude, longitude)
        VALUES (?, ?, ?, ?, ?)
    `
    
    result, err := db.Exec(query, 
        house.UserID, 
        house.Address, 
        house.City, 
        house.Latitude, 
        house.Longitude,
    )
    
    if err != nil {
        return err
    }
    
    id, err := result.LastInsertId()
    if err != nil {
        return err
    }
    
    house.ID = uint(id)
    return nil
}

// Get house by ID
func GetHouseByID(db *sql.DB, id uint) (*models.House, error) {
    query := `
        SELECT id, user_id, address, city, latitude, longitude, created_at
        FROM houses
        WHERE id = ?
    `
    
    house := &models.House{}
    err := db.QueryRow(query, id).Scan(
        &house.ID,
        &house.UserID,
        &house.Address,
        &house.City,
        &house.Latitude,
        &house.Longitude,
        &house.CreatedAt,
    )
    
    if err == sql.ErrNoRows {
        return nil, nil // House not found
    }
    
    if err != nil {
        return nil, err
    }
    
    return house, nil
}

// Get all houses for a user
func GetHousesByUserID(db *sql.DB, userID uint) ([]models.House, error) {
    query := `
        SELECT id, user_id, address, city, latitude, longitude, created_at
        FROM houses
        WHERE user_id = ?
        ORDER BY created_at DESC
    `
    
    rows, err := db.Query(query, userID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var houses []models.House
    
    for rows.Next() {
        var house models.House
        err := rows.Scan(
            &house.ID,
            &house.UserID,
            &house.Address,
            &house.City,
            &house.Latitude,
            &house.Longitude,
            &house.CreatedAt,
        )
        
        if err != nil {
            return nil, err
        }
        
        houses = append(houses, house)
    }
    
    return houses, nil
}
```

### Using Repository in Handler

```go
func GetMyHouses(c *gin.Context) {
    // 1. Get authenticated user ID from middleware
    userID, _ := c.Get("userID")
    
    // 2. Get database connection
    db := GetDB() // Your database instance
    
    // 3. Call repository
    houses, err := repository.GetHousesByUserID(db, userID.(uint))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch houses"})
        return
    }
    
    // 4. Return response
    c.JSON(http.StatusOK, houses)
}
```

---

## 6. MQTT INTEGRATION

### MQTT in Your Project

```
Simulator (Publisher)
    ↓
Publishes to topic: energy/meters/123
    ↓
Mosquitto Broker
    ↓
API Gateway (Subscriber)
    ↓
Saves to database + triggers predictions
```

### File: `internal/mqtt/subscriber.go`

```go
package mqtt

import (
    "encoding/json"
    "log"
    MQTT "github.com/eclipse/paho.mqtt.golang"
)

type MeterReading struct {
    MeterID     string  `json:"meter_id"`
    Consumption float64 `json:"consumption"`
    Timestamp   int64   `json:"timestamp"`
}

var messageHandler MQTT.MessageHandler = func(client MQTT.Client, msg MQTT.Message) {
    log.Printf("Received message on topic: %s", msg.Topic())
    
    var reading MeterReading
    err := json.Unmarshal(msg.Payload(), &reading)
    if err != nil {
        log.Printf("Error parsing message: %v", err)
        return
    }
    
    // Save to database
    SaveReading(reading)
    
    // Trigger price prediction
    TriggerPrediction(reading.MeterID)
}

func StartSubscriber(broker string) {
    opts := MQTT.NewClientOptions()
    opts.AddBroker(broker)
    opts.SetClientID("energy-api-subscriber")
    opts.SetDefaultPublishHandler(messageHandler)
    
    client := MQTT.NewClient(opts)
    
    if token := client.Connect(); token.Wait() && token.Error() != nil {
        log.Fatal(token.Error())
    }
    
    if token := client.Subscribe("energy/meters/+", 0, nil); token.Wait() && token.Error() != nil {
        log.Fatal(token.Error())
    }
    
    log.Println("MQTT subscriber started")
}
```

### File: `cmd/simulator/main.go` (Publisher)

```go
package main

import (
    "encoding/json"
    "math/rand"
    "time"
    MQTT "github.com/eclipse/paho.mqtt.golang"
)

func publishMeterReading(client MQTT.Client, meterID string) {
    reading := map[string]interface{}{
        "meter_id":    meterID,
        "consumption": rand.Float64() * 10, // Random consumption
        "timestamp":   time.Now().Unix(),
    }
    
    payload, _ := json.Marshal(reading)
    topic := "energy/meters/" + meterID
    
    token := client.Publish(topic, 0, false, payload)
    token.Wait()
}

func main() {
    opts := MQTT.NewClientOptions().AddBroker("tcp://localhost:1883")
    opts.SetClientID("simulator")
    
    client := MQTT.NewClient(opts)
    
    if token := client.Connect(); token.Wait() && token.Error() != nil {
        panic(token.Error())
    }
    
    // Publish every 5 seconds
    ticker := time.NewTicker(5 * time.Second)
    for range ticker.C {
        publishMeterReading(client, "meter-001")
    }
}
```

---

## 7. COMMON MODIFICATIONS YOU MIGHT BE ASKED

### Scenario 1: Add a New Endpoint

**Task:** "Add an endpoint to get the average consumption for a house"

**Steps:**

1. **Create Handler** (`internal/handlers/consumption.go`)
```go
func GetAverageConsumption(c *gin.Context) {
    houseID := c.Param("id")
    
    avg, err := repository.CalculateAverageConsumption(db, houseID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to calculate"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{"average": avg})
}
```

2. **Add Repository Function** (`internal/repository/consumption.go`)
```go
func CalculateAverageConsumption(db *sql.DB, houseID string) (float64, error) {
    query := `
        SELECT AVG(consumption)
        FROM meter_readings
        WHERE house_id = ?
    `
    
    var avg float64
    err := db.QueryRow(query, houseID).Scan(&avg)
    return avg, err
}
```

3. **Register Route** (`internal/routes/routes.go`)
```go
protected.GET("/houses/:id/consumption/average", handlers.GetAverageConsumption)
```

### Scenario 2: Add Validation

**Task:** "Ensure consumption cannot be negative"

```go
type MeterReading struct {
    Consumption float64 `json:"consumption" binding:"required,min=0"`
}

func CreateReading(c *gin.Context) {
    var reading MeterReading
    
    if err := c.ShouldBindJSON(&reading); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Consumption must be positive"})
        return
    }
    
    // Continue processing...
}
```

### Scenario 3: Add New Field to Model

**Task:** "Add a 'postal_code' field to houses"

1. **Update Model** (`internal/models/house.go`)
```go
type House struct {
    ID         uint      `json:"id"`
    PostalCode string    `json:"postal_code"` // NEW FIELD
    Address    string    `json:"address"`
    // ...
}
```

2. **Update Database Schema**
```sql
ALTER TABLE houses ADD COLUMN postal_code TEXT;
```

3. **Update Repository**
```go
func CreateHouse(db *sql.DB, house *models.House) error {
    query := `
        INSERT INTO houses (postal_code, address, city, latitude, longitude)
        VALUES (?, ?, ?, ?, ?)
    `
    
    result, err := db.Exec(query, 
        house.PostalCode, // Add this
        house.Address, 
        house.City,
        // ...
    )
}
```

### Scenario 4: Change Authentication

**Task:** "Make JWT tokens valid for 7 days instead of 24 hours"

**File:** `internal/auth/jwt.go`

```go
ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
```

---

## 8. DEBUGGING & TESTING

### Print Debugging

```go
import "log"

func MyHandler(c *gin.Context) {
    log.Println("Handler called")
    
    userID, _ := c.Get("userID")
    log.Printf("User ID: %v", userID)
    
    // Continue...
}
```

### Testing with curl

```bash
# Test login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# Test protected endpoint
curl -X GET http://localhost:8080/api/houses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `404 Not Found` | Route not registered | Check `routes.go` |
| `401 Unauthorized` | Missing/invalid token | Check middleware |
| `500 Internal Server Error` | Database/logic error | Check logs |
| `400 Bad Request` | Invalid JSON | Check request body |

---

## 🎯 EXAM PREPARATION CHECKLIST

Before the exam, make sure you can:

- [ ] Explain the request flow from HTTP to database
- [ ] Add a new endpoint with handler + repository + route
- [ ] Modify JWT token expiration time
- [ ] Add validation to a struct field
- [ ] Explain how MQTT messages are processed
- [ ] Debug with `log.Println()`
- [ ] Test endpoints with curl or Postman
- [ ] Explain difference between middleware and handlers
- [ ] Modify database queries
- [ ] Add a new field to a model

---

## 🚀 QUICK REFERENCE

### Key Files to Know

```
internal/handlers/     → Business logic
internal/routes/       → Route registration
internal/middleware/   → Auth & RBAC
internal/repository/   → Database operations
internal/auth/         → JWT generation
internal/models/       → Data structures
cmd/api-gateway/       → Main entry point
```

### Common Go Patterns

```go
// Error handling
if err != nil {
    return err
}

// JSON response
c.JSON(http.StatusOK, gin.H{"key": "value"})

// Get from context
value, exists := c.Get("key")

// Database query
rows, err := db.Query("SELECT * FROM table")
defer rows.Close()
```

---

**YOU'RE READY! 🎓** Now upload the exam PDF so I can create the final report template!
