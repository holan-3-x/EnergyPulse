# EnergyPulse: Distributed Energy Price Prediction System
## Final Project Report

**Student:** Holan Omeed Kunimohammed  
**Student ID:** 7193994  
**Course:** Distributed Programming for Web, IoT and Mobile Systems  
**Professor:** Letterio Galletta  
**Academic Year:** 2025-2026  
**Submission Date:** January 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [System Design and Architecture](#3-system-design-and-architecture)
4. [Technologies and Tools](#4-technologies-and-tools)
5. [Course Topics Coverage](#5-course-topics-coverage)
6. [Use Case Scenarios](#6-use-case-scenarios)
7. [Implementation Details](#7-implementation-details)
8. [Deployment and Execution](#8-deployment-and-execution)
9. [Testing and Validation](#9-testing-and-validation)
10. [Challenges and Solutions](#10-challenges-and-solutions)
11. [Future Enhancements](#11-future-enhancements)
12. [Conclusion](#12-conclusion)
13. [References](#13-references)

---

## 1. Executive Summary

EnergyPulse is a distributed energy price prediction system designed for smart home environments. The system leverages IoT sensors (smart meters) to collect real-time energy consumption data via MQTT protocol, processes this data through a microservices architecture, and provides predictive analytics for energy pricing using machine learning algorithms. The platform integrates blockchain-inspired transaction logging for data immutability and features a responsive web interface for user interaction.

**Key Features:**
- Real-time MQTT-based IoT data collection from 20+ simulated smart meters
- Microservices architecture with three independent services
- RESTful API with JWT-based authentication and role-based access control (RBAC)
- Machine learning-powered energy price prediction
- Blockchain-inspired immutable transaction logging
- Docker-based containerized deployment
- React-based responsive dashboard

**Project Scope:**
The system demonstrates practical implementation of distributed systems concepts including message-oriented middleware (MQTT), service-oriented architecture, stateless authentication, containerization, and real-time data processing.

---

## 2. Project Overview

### 2.1 Problem Statement

Modern smart homes generate vast amounts of energy consumption data through IoT devices. However, homeowners lack accessible tools to:
- Monitor real-time energy usage patterns
- Predict future energy costs based on consumption and external factors
- Verify the integrity of their energy transaction records
- Access these insights through user-friendly interfaces

### 2.2 Proposed Solution

EnergyPulse addresses these challenges by providing:

1. **IoT Integration:** MQTT-based real-time data collection from smart meters
2. **Distributed Architecture:** Scalable microservices design for independent service scaling
3. **Predictive Analytics:** ML-powered price forecasting considering consumption, weather, and time factors
4. **Data Integrity:** Blockchain-inspired hashing for transaction verification
5. **Secure Access:** JWT authentication with role-based permissions
6. **User Experience:** Modern React dashboard with real-time updates

### 2.3 System Objectives

- Demonstrate practical distributed systems design patterns
- Implement event-driven architecture using MQTT pub/sub
- Showcase RESTful API design with proper authentication
- Integrate external APIs (weather data) for enhanced predictions
- Provide containerized deployment for platform independence
- Maintain data immutability through cryptographic hashing

---

## 3. System Design and Architecture

### 3.1 High-Level Architecture

The system follows a **hybrid Event-Driven and RESTful microservices architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│                    (React SPA - Port 3000)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                       API Gateway                            │
│               (Go + Gin Framework - Port 8080)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Auth       │  │   Houses     │  │   Blockchain     │  │
│  │  Handlers    │  │   Handlers   │  │   Verification   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└───────────┬─────────────────────────────────┬───────────────┘
            │                                 │
            │ MQTT Subscribe                  │ SQLite
            │ (Topic: energy/meters/+)        │
            ↓                                 ↓
┌───────────────────────┐          ┌──────────────────────┐
│   MQTT Broker         │          │   Database Layer     │
│  (Mosquitto - 1883)   │          │   (SQLite + GORM)    │
└───────────┬───────────┘          └──────────────────────┘
            ↑
            │ MQTT Publish
            │
┌───────────────────────┐
│   Simulator Service   │
│  (Go - 20 Meters)     │
└───────────────────────┘
```

### 3.2 Architectural Patterns

#### 3.2.1 Microservices Architecture

**Three Independent Services:**

1. **API Gateway Service** (`cmd/api-gateway/`)
   - Handles all HTTP/REST requests
   - Manages user authentication and authorization
   - Subscribes to MQTT topics for meter readings
   - Performs ML predictions
   - Logs transactions to blockchain

2. **MQTT Broker Service** (`docker/mosquitto/`)
   - Message broker for IoT communication
   - Handles pub/sub for smart meter data
   - Decouples producers (meters) from consumers (API)

3. **Simulator Service** (`cmd/simulator/`)
   - Publishes meter readings to MQTT broker
   - Simulates 20 smart meters with realistic data
   - Demonstrates IoT device behavior

**Benefits:**
- Independent scaling of services
- Technology diversity (Go for backend, React for frontend)
- Fault isolation (broker failure doesn't crash API)
- Easy testing and deployment

#### 3.2.2 Repository Pattern

Database operations are abstracted through repositories:

```
Handler Layer (Business Logic)
      ↓
Repository Layer (Data Access)
      ↓
Database Layer (SQLite)
```

**Example:** `internal/repository/user.go`, `internal/repository/house.go`

This pattern provides:
- Separation of concerns
- Easy database migration (SQLite → PostgreSQL)
- Testable code through mock repositories

#### 3.2.3 Middleware Pattern

Cross-cutting concerns handled via middleware chain:

```
HTTP Request → CORS → JWT Auth → RBAC → Handler → Response
```

**Middleware Components:**
- `middleware.AuthRequired()` - Validates JWT tokens
- `middleware.AdminOnly()` - Enforces admin-only routes
- `gin.Logger()` - Request logging

### 3.3 Communication Patterns

#### 3.3.1 Synchronous Communication (REST)

- Frontend ↔ API Gateway: HTTP/REST over JSON
- Endpoints follow RESTful conventions (GET, POST, PUT, DELETE)
- Stateless communication using JWT tokens

#### 3.3.2 Asynchronous Communication (MQTT)

- Simulator → MQTT Broker: Publish meter readings
- API Gateway ← MQTT Broker: Subscribe to meter data
- QoS Level 0 (fire-and-forget) for high throughput

**MQTT Topic Structure:**
```
energy/meters/+
  ├── energy/meters/meter-001
  ├── energy/meters/meter-002
  └── ... (20 total)
```

### 3.4 Data Flow

#### Complete User Registration Flow:

```
1. User fills registration form → React Frontend
2. POST /api/auth/register → API Gateway
3. Handler validates input → internal/handlers/auth.go
4. Hash password (bcrypt) → internal/auth/password.go
5. Create user record → internal/repository/user.go
6. Insert to database → SQLite
7. Generate JWT token → internal/auth/jwt.go
8. Return token + user data → Frontend
9. Store token in localStorage → React App
```

#### Meter Reading to Prediction Flow:

```
1. Simulator generates reading → cmd/simulator/main.go
2. Publish to MQTT topic → energy/meters/123
3. Mosquitto broker receives → Port 1883
4. API Gateway subscribes → internal/mqtt/subscriber.go
5. Parse JSON payload → MeterReading struct
6. Save to database → repository.CreateReading()
7. Fetch weather data → OpenMeteo API
8. Calculate prediction → internal/ml/predictor.go
9. Log to blockchain → internal/blockchain/block.go
10. Store prediction → database
11. Frontend polls/fetches → GET /api/predictions
```

### 3.5 Database Schema

```sql
-- Users Table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Houses Table
CREATE TABLE houses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Meter Readings Table
CREATE TABLE meter_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    house_id INTEGER NOT NULL,
    consumption REAL NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (house_id) REFERENCES houses(id)
);

-- Predictions Table
CREATE TABLE predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    house_id INTEGER NOT NULL,
    predicted_price REAL NOT NULL,
    weather_temp REAL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (house_id) REFERENCES houses(id)
);

-- Blockchain Transactions Table
CREATE TABLE blockchain_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_hash TEXT UNIQUE NOT NULL,
    previous_hash TEXT NOT NULL,
    data TEXT NOT NULL,
    timestamp INTEGER NOT NULL
);
```

### 3.6 Security Architecture

#### Authentication Flow:

```
1. User Login → Credentials sent to /api/auth/login
2. Password verification → bcrypt.CompareHashAndPassword()
3. JWT generation → jwt.NewWithClaims()
   - Payload: {user_id, role, exp, iat}
   - Signature: HMAC-SHA256
4. Token returned → Frontend stores in localStorage
5. Subsequent requests → Authorization: Bearer <token>
6. Middleware validates → auth.ValidateToken()
7. Extract claims → user_id, role stored in context
8. Handler accesses → c.Get("userID")
```

#### Role-Based Access Control (RBAC):

| Role  | Permissions |
|-------|-------------|
| Admin | All operations + user management + system stats |
| User  | Own houses, readings, predictions |

**Implementation:**
```go
// Admin-only routes
admin := api.Group("/admin")
admin.Use(middleware.AuthRequired(), middleware.AdminOnly())
{
    admin.GET("/users", handlers.GetAllUsers)
    admin.DELETE("/users/:id", handlers.DeleteUser)
}
```

---

## 4. Technologies and Tools

### 4.1 Backend Technologies

#### 4.1.1 Go (Golang) 1.21+

**Rationale:**
- High-performance concurrent programming (goroutines)
- Native HTTP server support
- Excellent for microservices and distributed systems
- Strong typing reduces runtime errors
- Fast compilation and execution

**Key Libraries:**

| Library | Purpose | Usage |
|---------|---------|-------|
| `gin-gonic/gin` | HTTP web framework | RESTful API routing and handlers |
| `golang-jwt/jwt` | JSON Web Tokens | Authentication |
| `eclipse/paho.mqtt.golang` | MQTT client | IoT messaging |
| `gorm.io/gorm` | ORM | Database abstraction |
| `golang.org/x/crypto/bcrypt` | Password hashing | Secure password storage |

#### 4.1.2 SQLite

**Rationale:**
- Serverless, zero-configuration
- Perfect for development and demonstration
- ACID compliance
- Embeddable in Go binary

**Production Alternative:** PostgreSQL for better concurrency

### 4.2 Message Broker

#### 4.2.1 Eclipse Mosquitto (MQTT Broker)

**Rationale:**
- Lightweight pub/sub messaging
- Perfect for IoT scenarios
- Low bandwidth overhead
- Support for Quality of Service (QoS) levels

**MQTT vs HTTP for IoT:**

| Feature | MQTT | HTTP |
|---------|------|------|
| Overhead | ~2 bytes header | ~200+ bytes |
| Pattern | Pub/Sub | Request/Response |
| Connection | Persistent | Per-request |
| Bandwidth | Low | High |
| IoT Suitability | Excellent | Poor |

### 4.3 Frontend Technologies

#### 4.3.1 React 18 + TypeScript

**Rationale:**
- Component-based architecture
- Virtual DOM for performance
- TypeScript for type safety
- Large ecosystem

**Key Libraries:**

| Library | Purpose |
|---------|---------|
| `recharts` | Data visualization |
| `axios` | HTTP client |
| `react-router-dom` | Client-side routing |
| `lucide-react` | Icon library |

#### 4.3.2 Vite

**Build Tool:**
- Fast hot module replacement (HMR)
- Optimized production builds
- Native ES modules support

### 4.4 Containerization

#### 4.4.1 Docker + Docker Compose

**Rationale:**
- Platform-independent deployment
- Service orchestration
- Environment consistency
- Easy scaling

**Services Defined:**
```yaml
services:
  mqtt-broker:    # Mosquitto on port 1883
  api-gateway:    # Go API on port 8080
  simulator:      # Meter simulator
  frontend:       # React app on port 3000
```

### 4.5 External APIs

#### 4.5.1 OpenMeteo Weather API

**Purpose:** Fetch real-time weather data for prediction accuracy

**Endpoint Example:**
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude=43.7696
  &longitude=11.2558
  &current_weather=true
```

**Data Used:**
- Temperature
- Wind speed
- Weather code

#### 4.5.2 Nominatim (OpenStreetMap)

**Purpose:** Geocoding and reverse geocoding

**Usage:** Convert city names to coordinates for weather API

### 4.6 Development Tools

| Tool | Purpose |
|------|---------|
| Git | Version control |
| VS Code | IDE |
| Postman | API testing |
| Docker Desktop | Container management |

---

## 5. Course Topics Coverage

This section demonstrates how the project implements concepts from the course syllabus.

### 5.1 Distributed Systems Fundamentals

**Topics Covered:**

#### 5.1.1 Client-Server Architecture ✓
- **Implementation:** React frontend (client) communicates with Go API Gateway (server)
- **Evidence:** `static/services/api.ts` makes HTTP requests to `http://localhost:8080/api/*`
- **RESTful Design:** Stateless communication, resource-based URLs

#### 5.1.2 Microservices Architecture ✓
- **Implementation:** Three independent services with clear boundaries
- **Services:**
  1. API Gateway - Business logic
  2. MQTT Broker - Message routing
  3. Simulator - Data generation
- **Benefits Demonstrated:** Independent deployment, technology diversity, fault isolation

#### 5.1.3 Message-Oriented Middleware (MOM) ✓
- **Technology:** MQTT (Mosquitto broker)
- **Pattern:** Publish-Subscribe
- **Implementation:**
  - Publisher: `cmd/simulator/main.go` (lines 45-60)
  - Subscriber: `internal/mqtt/subscriber.go` (lines 20-45)
- **Topics:** `energy/meters/+` with wildcard subscription
- **QoS Level:** 0 (at most once delivery)

**Code Evidence:**
```go
// Subscriber
client.Subscribe("energy/meters/+", 0, messageHandler)

// Publisher
client.Publish("energy/meters/meter-001", 0, false, payload)
```

### 5.2 Web Technologies

#### 5.2.1 RESTful API Design ✓
- **Implementation:** 18+ endpoints following REST conventions
- **File:** `internal/routes/routes.go`

**Endpoints by Resource:**

| Resource | Endpoints | HTTP Methods |
|----------|-----------|--------------|
| Authentication | `/api/auth/login`, `/api/auth/register` | POST |
| Houses | `/api/houses`, `/api/houses/:id` | GET, POST, PUT, DELETE |
| Predictions | `/api/predictions/:house_id` | GET |
| Blockchain | `/api/blockchain/verify/:hash` | GET |
| Admin | `/api/admin/users`, `/api/admin/stats` | GET, DELETE |

**REST Principles Applied:**
- Stateless communication (JWT in header)
- Resource-based URLs
- Standard HTTP methods
- JSON payloads
- Proper status codes (200, 201, 400, 401, 403, 500)

#### 5.2.2 HTTP Protocol ✓
- **Methods Used:** GET, POST, PUT, DELETE
- **Headers:** Content-Type, Authorization, CORS
- **Status Codes:** Proper semantic usage
- **Content Negotiation:** JSON (application/json)

#### 5.2.3 CORS (Cross-Origin Resource Sharing) ✓
- **Implementation:** `internal/routes/routes.go` - CORS middleware
- **Configuration:**
```go
config := cors.DefaultConfig()
config.AllowOrigins = []string{"http://localhost:3000"}
config.AllowCredentials = true
router.Use(cors.New(config))
```

### 5.3 Authentication & Security

#### 5.3.1 JWT (JSON Web Tokens) ✓
- **Implementation:** `internal/auth/jwt.go`
- **Algorithm:** HMAC-SHA256
- **Payload Structure:**
```json
{
  "user_id": 1,
  "role": "admin",
  "exp": 1704326400,
  "iat": 1704240000
}
```
- **Token Lifecycle:** 24-hour expiration
- **Storage:** Frontend localStorage

#### 5.3.2 Password Security ✓
- **Hashing Algorithm:** bcrypt (cost factor 14)
- **Implementation:** `internal/auth/password.go`
- **Salt:** Automatically generated per password
- **Verification:** Constant-time comparison

```go
hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), 14)
err := bcrypt.CompareHashAndPassword(hashedPassword, password)
```

#### 5.3.3 Role-Based Access Control (RBAC) ✓
- **Roles:** Admin, User
- **Implementation:** `internal/middleware/auth.go`
- **Enforcement:**
  - `AuthRequired()` middleware - Validates JWT
  - `AdminOnly()` middleware - Checks role claim
- **Example:**
```go
// Only admins can access
admin.Use(middleware.AuthRequired(), middleware.AdminOnly())
```

### 5.4 IoT & Sensor Networks

#### 5.4.1 MQTT Protocol ✓
- **Broker:** Eclipse Mosquitto
- **Port:** 1883 (default)
- **Topics:** Hierarchical structure `energy/meters/{meter_id}`
- **Pattern:** Pub/Sub with wildcard subscription (+)

**Why MQTT for IoT:**
- Low bandwidth (2-byte header vs HTTP's 200+ bytes)
- Persistent connections (no TCP handshake per message)
- Built-in QoS levels
- Last Will and Testament (LWT) for device disconnection

#### 5.4.2 Sensor Data Simulation ✓
- **Implementation:** `cmd/simulator/main.go`
- **Meters:** 20 simulated smart meters
- **Data Generated:**
  - Consumption (kWh): Random walk with daily patterns
  - Timestamp: Unix epoch
  - Meter ID: Unique identifier
- **Publishing Rate:** Every 5 seconds per meter

**Realistic Data Generation:**
```go
// Simulate daily consumption pattern
hour := time.Now().Hour()
baseConsumption := 2.0
if hour >= 18 && hour <= 22 {
    baseConsumption = 5.0 // Peak evening hours
}
consumption := baseConsumption + rand.Float64()*2
```

### 5.5 Data Persistence

#### 5.5.1 Relational Database (SQLite) ✓
- **ORM:** GORM
- **Database File:** `data/energy.db`
- **Tables:** Users, Houses, MeterReadings, Predictions, BlockchainTransactions
- **Relationships:** Foreign keys with referential integrity

#### 5.5.2 Database Migrations ✓
- **Auto-migration:** GORM creates tables on startup
- **Schema Evolution:** Version-controlled via Git
- **Implementation:** `internal/database/connection.go`

```go
db.AutoMigrate(&models.User{}, &models.House{}, &models.MeterReading{})
```

### 5.6 Containerization & Deployment

#### 5.6.1 Docker ✓
- **Multi-stage Builds:** Optimized Go binary images
- **Dockerfiles:**
  - `docker/api-gateway.Dockerfile`
  - `docker/simulator.Dockerfile`
  - `docker/frontend.Dockerfile`

**Example Multi-stage Build:**
```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o api-gateway cmd/api-gateway/main.go

# Runtime stage
FROM alpine:latest
COPY --from=builder /app/api-gateway /api-gateway
CMD ["/api-gateway"]
```

#### 5.6.2 Docker Compose ✓
- **File:** `docker-compose.yml`
- **Services Orchestration:** 4 containers
- **Networking:** Internal Docker network
- **Volume Mounts:** Persistent data storage
- **Health Checks:** Ensure services are ready

```yaml
services:
  mqtt-broker:
    depends_on: []
  api-gateway:
    depends_on:
      - mqtt-broker
  simulator:
    depends_on:
      - mqtt-broker
  frontend:
    depends_on:
      - api-gateway
```

### 5.7 Additional Concepts

#### 5.7.1 Blockchain Concepts ✓
- **Purpose:** Immutable transaction logging (educational demonstration)
- **Implementation:** `internal/blockchain/block.go`
- **Algorithm:** SHA-256 hashing
- **Chain Structure:** Each block references previous hash

```go
type Block struct {
    Hash         string
    PreviousHash string
    Data         string
    Timestamp    int64
}

hash := sha256.Sum256([]byte(previousHash + data + timestamp))
```

**Note:** This is a simplified blockchain for demonstrating immutability, not a production cryptocurrency implementation.

#### 5.7.2 Concurrent Programming ✓
- **Goroutines:** MQTT subscriber runs in separate goroutine
- **Channels:** Used for graceful shutdown
- **Implementation:**
```go
go mqtt.StartSubscriber(brokerURL)
```

#### 5.7.3 Machine Learning Integration ✓
- **Model:** Linear regression for price prediction
- **Features:**
  - Historical consumption
  - Current weather (temperature, wind)
  - Time of day
  - Day of week
- **Implementation:** `internal/ml/predictor.go`

**Simplified Formula:**
```
Price = BasePrice + (Consumption × 0.15) + (Temperature × 0.02) - (WindSpeed × 0.01)
```

---

## 6. Use Case Scenarios

### Use Case 1: User Registration and First House Setup

**Actor:** New Homeowner (Sarah)

**Preconditions:** None

**Main Flow:**

1. Sarah opens the EnergyPulse web application at `http://localhost:3000`
2. Clicks "Register" on the login page
3. Fills registration form:
   - Email: `sarah@email.com`
   - Password: `SecurePass123!`
   - Confirm Password: `SecurePass123!`
4. System validates input (email format, password strength)
5. Backend hashes password using bcrypt (cost factor 14)
6. User record created in database with role "user"
7. JWT token generated with 24-hour expiration
8. Sarah is automatically logged in and redirected to dashboard
9. Dashboard shows "No houses yet" message
10. Sarah clicks "Add House" button
11. Fills house form:
    - Address: `Via dei Calzaiuoli, 3`
    - City: `Florence`
    - (System auto-fetches coordinates via Nominatim API)
12. House record created and linked to Sarah's account
13. System assigns a smart meter (meter-001) to the house
14. Dashboard updates showing the new house card

**Postconditions:**
- Sarah has an active account
- One house registered with smart meter
- JWT token stored in browser localStorage

**System Interactions:**

```
Frontend → POST /api/auth/register
          ↓
API validates & hashes password
          ↓
Database inserts user record
          ↓
JWT token generated
          ↓
Frontend receives token + user data
          ↓
Frontend → POST /api/houses
          ↓
Nominatim API fetches coordinates
          ↓
Database inserts house record
          ↓
Dashboard updates
```

**Code Trace:**

1. `static/components/Auth/Register.tsx` - Form submission
2. `static/services/auth.ts` - API call
3. `internal/handlers/auth.go:Register()` - Handler
4. `internal/repository/user.go:CreateUser()` - Database
5. `internal/auth/jwt.go:GenerateToken()` - Token creation
6. Response returned to frontend

---

### Use Case 2: Real-time Energy Monitoring and Price Prediction

**Actor:** Registered User (Sarah)

**Preconditions:**
- Sarah is logged in
- House with smart meter is registered
- Simulator is publishing meter readings

**Main Flow:**

1. Sarah logs into dashboard
2. Views her house card showing:
   - Current consumption: `4.2 kWh`
   - Last updated: `2 minutes ago`
3. Clicks "View Details" on house card
4. System displays detailed analytics:
   - Consumption graph (last 24 hours)
   - Weather data (temperature, wind speed)
   - Price prediction: `€0.38/kWh`
5. Every 5 seconds, simulator publishes new meter reading:
   ```json
   {
     "meter_id": "meter-001",
     "consumption": 4.5,
     "timestamp": 1704326400
   }
   ```
6. MQTT broker receives message
7. API Gateway (subscriber) processes message:
   - Saves reading to database
   - Fetches current weather from OpenMeteo API
   - Calculates price prediction using ML model
   - Logs transaction to blockchain
8. Sarah's dashboard auto-refreshes every 30 seconds
9. Updated consumption and prediction displayed
10. Sarah clicks "View Blockchain" to verify transaction integrity
11. System displays transaction hash and verification status

**Postconditions:**
- New meter reading stored
- Price prediction updated
- Blockchain transaction logged
- Dashboard shows latest data

**System Interactions:**

```
Simulator → MQTT Publish (energy/meters/001)
              ↓
Mosquitto Broker
              ↓
API Gateway (MQTT Subscriber)
              ↓
┌─────────────┼───────────────┬──────────────┐
│             │               │              │
Save Reading  Get Weather    ML Predict    Blockchain Log
     ↓             ↓             ↓              ↓
  Database    OpenMeteo API  Calculate     SHA-256 Hash
              ↓
Frontend Polls → GET /api/predictions/:house_id
              ↓
Dashboard Updates
```

**MQTT Message Flow:**

```
1. Simulator:
   topic: "energy/meters/meter-001"
   payload: {"meter_id":"meter-001","consumption":4.5,"timestamp":1704326400}

2. Broker:
   Route to subscribers of "energy/meters/+"

3. API Gateway:
   Receives via messageHandler()
   Parses JSON
   Calls handleMeterReading()
```

**Code Trace:**

1. `cmd/simulator/main.go:publishReading()` - Publish to MQTT
2. `internal/mqtt/subscriber.go:messageHandler()` - Receive message
3. `internal/mqtt/subscriber.go:handleMeterReading()` - Process data
4. `internal/repository/reading.go:CreateReading()` - Save to DB
5. `internal/ml/predictor.go:PredictPrice()` - ML calculation
6. `internal/blockchain/block.go:AddBlock()` - Hash transaction
7. Frontend polls `GET /api/predictions/:id`
8. `internal/handlers/prediction.go:GetPredictions()` - Return data

---

### Use Case 3: Admin User Management

**Actor:** System Administrator (Alex)

**Preconditions:**
- Alex has admin role
- Logged in with admin credentials

**Main Flow:**

1. Alex logs in with admin email: `admin@energypulse.com`
2. Dashboard shows "Admin Panel" option
3. Clicks "Admin Panel" → navigates to `/admin`
4. Views system statistics:
   - Total users: 45
   - Total houses: 127
   - Active meters: 127
   - Predictions today: 3,420
5. Clicks "Manage Users" tab
6. Views paginated user list with columns:
   - ID | Email | Role | Houses | Created Date | Actions
7. Identifies problematic user (suspicious activity)
8. Clicks "View Details" for user ID 23
9. Sees user's houses and consumption history
10. Decides to delete user
11. Clicks "Delete User" button
12. Confirmation modal appears
13. Alex confirms deletion
14. System performs cascade delete:
    - User record removed
    - Associated houses removed
    - Meter readings archived (for audit trail)
    - Predictions archived
15. User list updates, showing user removed
16. Audit log entry created

**Postconditions:**
- User account deleted
- Related data cleaned up
- Audit trail maintained
- Admin notified of successful deletion

**Authorization Flow:**

```
Frontend → DELETE /api/admin/users/:id
           Authorization: Bearer <admin_jwt_token>
           ↓
Middleware: AuthRequired()
    → Validates JWT
    → Extracts user_id and role
           ↓
Middleware: AdminOnly()
    → Checks if role == "admin"
    → If not, returns 403 Forbidden
           ↓
Handler: DeleteUser()
    → Performs deletion
           ↓
Database: Cascade delete related records
           ↓
Response: 200 OK
```

**Code Trace:**

1. `static/pages/Admin.tsx` - Admin dashboard
2. `static/services/admin.ts:deleteUser()` - API call with JWT
3. `internal/routes/routes.go` - Route with middleware chain:
   ```go
   admin.DELETE("/users/:id", 
       middleware.AuthRequired(),
       middleware.AdminOnly(),
       handlers.DeleteUser)
   ```
4. `internal/middleware/auth.go:AuthRequired()` - JWT validation
5. `internal/middleware/auth.go:AdminOnly()` - Role check
6. `internal/handlers/admin.go:DeleteUser()` - Business logic
7. `internal/repository/user.go:DeleteUser()` - Database operation

**RBAC Enforcement:**

If a regular user tries to access admin endpoint:

```
Regular User JWT:
{
  "user_id": 5,
  "role": "user",  ← NOT admin
  "exp": 1704326400
}

Request: DELETE /api/admin/users/23
Result: 403 Forbidden
Response: {"error": "Admin access required"}
```

---

## 7. Implementation Details

### 7.1 Backend Implementation

#### 7.1.1 Project Structure

```
cmd/
├── api-gateway/
│   └── main.go              # Entry point for API server
└── simulator/
    └── main.go              # Entry point for MQTT simulator

internal/
├── auth/
│   ├── jwt.go               # JWT token generation & validation
│   └── password.go          # Password hashing (bcrypt)
├── blockchain/
│   └── block.go             # Blockchain implementation
├── database/
│   └── connection.go        # Database initialization
├── handlers/
│   ├── auth.go              # Authentication handlers
│   ├── house.go             # House management handlers
│   ├── prediction.go        # Prediction handlers
│   └── admin.go             # Admin handlers
├── middleware/
│   └── auth.go              # JWT & RBAC middleware
├── models/
│   ├── user.go              # User model
│   ├── house.go             # House model
│   └── reading.go           # Meter reading model
├── mqtt/
│   └── subscriber.go        # MQTT subscriber
├── repository/
│   ├── user.go              # User database operations
│   ├── house.go             # House database operations
│   └── reading.go           # Reading database operations
└── routes/
    └── routes.go            # Route definitions
```

#### 7.1.2 Main Entry Point Analysis

**File: `cmd/api-gateway/main.go`**

```go
package main

import (
    "log"
    "github.com/gin-gonic/gin"
    "energypulse/internal/database"
    "energypulse/internal/routes"
    "energypulse/internal/mqtt"
)

func main() {
    // 1. Initialize database connection
    db, err := database.Connect("data/energy.db")
    if err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    defer db.Close()
    
    // 2. Run database migrations
    database.Migrate(db)
    
    // 3. Start MQTT subscriber in background goroutine
    go mqtt.StartSubscriber("tcp://localhost:1883")
    
    // 4. Initialize Gin router
    router := gin.Default()
    
    // 5. Setup routes
    routes.SetupRoutes(router, db)
    
    // 6. Start HTTP server
    log.Println("API Gateway starting on :8080")
    router.Run(":8080")
}
```

**Key Steps Explained:**

1. **Database Initialization:** Establishes SQLite connection
2. **Schema Migration:** Creates tables if they don't exist
3. **MQTT Subscriber:** Starts listening for meter readings (asynchronous)
4. **Router Setup:** Configures HTTP routes and middleware
5. **Server Start:** Listens on port 8080

#### 7.1.3 Authentication Handler Deep Dive

**File: `internal/handlers/auth.go`**

```go
package handlers

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "energypulse/internal/auth"
    "energypulse/internal/repository"
    "energypulse/internal/models"
)

// Login handles user authentication
func Login(c *gin.Context) {
    // 1. Parse request body
    var req struct {
        Email    string `json:"email" binding:"required,email"`
        Password string `json:"password" binding:"required"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
        return
    }
    
    // 2. Fetch user from database
    db := c.MustGet("db").(*sql.DB)
    user, err := repository.GetUserByEmail(db, req.Email)
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
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
        return
    }
    
    // 5. Return response
    c.JSON(http.StatusOK, gin.H{
        "token": token,
        "user": gin.H{
            "id":    user.ID,
            "email": user.Email,
            "role":  user.Role,
        },
    })
}

// Register handles new user creation
func Register(c *gin.Context) {
    var req struct {
        Email    string `json:"email" binding:"required,email"`
        Password string `json:"password" binding:"required,min=8"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    // Hash password
    hashedPassword, err := auth.HashPassword(req.Password)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
        return
    }
    
    // Create user
    db := c.MustGet("db").(*sql.DB)
    user := &models.User{
        Email:    req.Email,
        Password: hashedPassword,
        Role:     "user",
    }
    
    err = repository.CreateUser(db, user)
    if err != nil {
        c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
        return
    }
    
    // Generate token
    token, _ := auth.GenerateToken(user.ID, user.Role)
    
    c.JSON(http.StatusCreated, gin.H{
        "token": token,
        "user": gin.H{
            "id":    user.ID,
            "email": user.Email,
            "role":  user.Role,
        },
    })
}
```

**Security Measures:**
- Input validation (email format, password length)
- Bcrypt password hashing (cost factor 14)
- SQL injection prevention (parameterized queries)
- Error message sanitization (no user enumeration)
- JWT with expiration

#### 7.1.4 MQTT Subscriber Implementation

**File: `internal/mqtt/subscriber.go`**

```go
package mqtt

import (
    "encoding/json"
    "log"
    MQTT "github.com/eclipse/paho.mqtt.golang"
    "energypulse/internal/repository"
    "energypulse/internal/ml"
)

type MeterReading struct {
    MeterID     string  `json:"meter_id"`
    Consumption float64 `json:"consumption"`
    Timestamp   int64   `json:"timestamp"`
}

// Message handler called when MQTT message arrives
var messageHandler MQTT.MessageHandler = func(client MQTT.Client, msg MQTT.Message) {
    log.Printf("[MQTT] Received on topic: %s", msg.Topic())
    
    // Parse JSON payload
    var reading MeterReading
    if err := json.Unmarshal(msg.Payload(), &reading); err != nil {
        log.Printf("[MQTT] Error parsing message: %v", err)
        return
    }
    
    log.Printf("[MQTT] Meter %s: %.2f kWh", reading.MeterID, reading.Consumption)
    
    // Process the reading
    go handleMeterReading(reading)
}

func handleMeterReading(reading MeterReading) {
    // 1. Find house associated with meter
    house, err := repository.GetHouseByMeterID(db, reading.MeterID)
    if err != nil {
        log.Printf("House not found for meter %s", reading.MeterID)
        return
    }
    
    // 2. Save reading to database
    err = repository.CreateReading(db, house.ID, reading.Consumption, reading.Timestamp)
    if err != nil {
        log.Printf("Failed to save reading: %v", err)
        return
    }
    
    // 3. Fetch weather data
    weather, err := fetchWeatherData(house.Latitude, house.Longitude)
    if err != nil {
        log.Printf("Failed to fetch weather: %v", err)
        // Continue with default weather values
        weather = &WeatherData{Temperature: 20.0, WindSpeed: 5.0}
    }
    
    // 4. Predict price
    predictedPrice := ml.PredictPrice(reading.Consumption, weather.Temperature, weather.WindSpeed)
    
    // 5. Save prediction
    err = repository.CreatePrediction(db, house.ID, predictedPrice, weather.Temperature)
    if err != nil {
        log.Printf("Failed to save prediction: %v", err)
        return
    }
    
    // 6. Log to blockchain
    blockchainData := fmt.Sprintf("House:%d,Consumption:%.2f,Price:%.2f", 
        house.ID, reading.Consumption, predictedPrice)
    blockchain.AddBlock(blockchainData)
    
    log.Printf("[SUCCESS] Processed reading for house %d", house.ID)
}

func StartSubscriber(brokerURL string) {
    opts := MQTT.NewClientOptions()
    opts.AddBroker(brokerURL)
    opts.SetClientID("energypulse-api-subscriber")
    opts.SetDefaultPublishHandler(messageHandler)
    opts.SetAutoReconnect(true)
    
    client := MQTT.NewClient(opts)
    
    if token := client.Connect(); token.Wait() && token.Error() != nil {
        log.Fatal("[MQTT] Connection failed:", token.Error())
    }
    
    log.Println("[MQTT] Connected to broker:", brokerURL)
    
    // Subscribe with wildcard to all meters
    topic := "energy/meters/+"
    if token := client.Subscribe(topic, 0, nil); token.Wait() && token.Error() != nil {
        log.Fatal("[MQTT] Subscription failed:", token.Error())
    }
    
    log.Printf("[MQTT] Subscribed to topic: %s", topic)
    
    // Keep subscriber running
    select {}
}
```

**Key Concepts:**
- **Wildcard Subscription:** `+` matches any meter ID
- **Asynchronous Processing:** `go handleMeterReading()` prevents blocking
- **Error Handling:** Graceful degradation if weather API fails
- **Auto-reconnect:** Resilient to broker restarts

### 7.2 Frontend Implementation

#### 7.2.1 Project Structure

```
static/
├── components/
│   ├── Auth/
│   │   ├── Login.tsx        # Login form
│   │   └── Register.tsx     # Registration form
│   ├── Dashboard/
│   │   ├── HouseCard.tsx    # House display component
│   │   └── Stats.tsx        # Statistics component
│   └── Common/
│       ├── Navbar.tsx       # Navigation bar
│       └── ProtectedRoute.tsx # Auth guard
├── services/
│   ├── api.ts               # Axios instance with interceptors
│   ├── auth.ts              # Auth API calls
│   └── houses.ts            # House API calls
├── pages/
│   ├── Dashboard.tsx        # Main dashboard page
│   ├── HouseDetails.tsx     # Individual house page
│   └── Admin.tsx            # Admin panel
└── App.tsx                  # Root component with routing
```

#### 7.2.2 API Service Setup

**File: `static/services/api.ts`**

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Benefits:**
- Centralized token management
- Automatic token injection
- Global error handling
- DRY principle (Don't Repeat Yourself)

#### 7.2.3 Protected Route Component

**File: `static/components/Common/ProtectedRoute.tsx`**

```typescript
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false 
}) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  // Not logged in
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  // Admin-only route but user is not admin
  if (adminOnly && userStr) {
    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      return <Navigate to="/dashboard" />;
    }
  }
  
  return <>{children}</>;
};
```

**Usage in Router:**

```typescript
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } />
  
  <Route path="/admin" element={
    <ProtectedRoute adminOnly>
      <AdminPanel />
    </ProtectedRoute>
  } />
</Routes>
```

#### 7.2.4 Real-time Dashboard Component

**File: `static/pages/Dashboard.tsx`**

```typescript
import { useEffect, useState } from 'react';
import { getMyHouses } from '../services/houses';
import { HouseCard } from '../components/Dashboard/HouseCard';

interface House {
  id: number;
  address: string;
  city: string;
  current_consumption: number;
  predicted_price: number;
  last_updated: string;
}

export const Dashboard = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch houses on component mount
  useEffect(() => {
    fetchHouses();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHouses, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const fetchHouses = async () => {
    try {
      const data = await getMyHouses();
      setHouses(data);
    } catch (error) {
      console.error('Failed to fetch houses:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="dashboard">
      <h1>My Houses</h1>
      
      {houses.length === 0 ? (
        <div className="empty-state">
          <p>No houses registered yet.</p>
          <button onClick={() => navigate('/add-house')}>
            Add Your First House
          </button>
        </div>
      ) : (
        <div className="house-grid">
          {houses.map(house => (
            <HouseCard key={house.id} house={house} />
          ))}
        </div>
      )}
    </div>
  );
};
```

**Key Features:**
- **Auto-refresh:** Polls API every 30 seconds for updates
- **Loading states:** Provides user feedback
- **Empty state handling:** Guides users to add houses
- **Cleanup:** Clears interval on component unmount

---

## 8. Deployment and Execution

### 8.1 Prerequisites

Before running the project, ensure you have:

| Tool | Version | Purpose |
|------|---------|---------|
| Docker | 20.10+ | Container runtime |
| Docker Compose | 2.0+ | Multi-container orchestration |
| Node.js | 18+ | Frontend build (if running outside Docker) |
| Go | 1.21+ | Backend build (if running outside Docker) |

### 8.2 Quick Start with Docker Compose

**Step 1: Clone the Repository**
```bash
git clone https://github.com/yourusername/energypulse.git
cd energypulse
```

**Step 2: Configure Environment Variables**
```bash
cp .env.example .env
# Edit .env with your settings
```

**Example `.env` file:**
```bash
# Database
DB_PATH=data/energy.db

# JWT Secret (change in production!)
JWT_SECRET=your-super-secret-key-change-this-in-production

# MQTT Broker
MQTT_BROKER=tcp://mqtt-broker:1883
MQTT_TOPIC=energy/meters/+

# API Server
API_PORT=8080

# Weather API (optional)
WEATHER_API_KEY=your-openmeteo-key
```

**Step 3: Build and Start Services**
```bash
docker-compose up --build
```

**Expected Output:**
```
[+] Running 4/4
 ✔ Container energypulse-mqtt-broker-1  Started
 ✔ Container energypulse-api-gateway-1  Started
 ✔ Container energypulse-simulator-1    Started
 ✔ Container energypulse-frontend-1     Started
```

**Step 4: Access the Application**
- Frontend: http://localhost:3000
- API: http://localhost:8080
- MQTT Broker: tcp://localhost:1883

**Step 5: Test with Demo Credentials**
```
Email: admin@energypulse.com
Password: admin123
```

### 8.3 Manual Deployment (Without Docker)

#### Backend Setup:

```bash
# Navigate to project root
cd energypulse

# Install Go dependencies
go mod download

# Run database migrations
go run cmd/migrate/main.go

# Start API Gateway
go run cmd/api-gateway/main.go
```

#### MQTT Broker Setup:

```bash
# Install Mosquitto
sudo apt-get install mosquitto mosquitto-clients

# Start broker
mosquitto -c docker/mosquitto/mosquitto.conf
```

#### Simulator Setup:

```bash
# In a new terminal
go run cmd/simulator/main.go
```

#### Frontend Setup:

```bash
cd static

# Install dependencies
npm install

# Start development server
npm run dev
```

### 8.4 Docker Compose Configuration

**File: `docker-compose.yml`**

```yaml
version: '3.8'

services:
  mqtt-broker:
    image: eclipse-mosquitto:2.0
    container_name: energypulse-mqtt
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./docker/mosquitto/mosquitto.conf:/mosquitto/config/mosquitto.conf
    networks:
      - energypulse-network

  api-gateway:
    build:
      context: .
      dockerfile: docker/api-gateway.Dockerfile
    container_name: energypulse-api
    ports:
      - "8080:8080"
    environment:
      - DB_PATH=/data/energy.db
      - JWT_SECRET=${JWT_SECRET}
      - MQTT_BROKER=tcp://mqtt-broker:1883
    volumes:
      - ./data:/data
    depends_on:
      - mqtt-broker
    networks:
      - energypulse-network

  simulator:
    build:
      context: .
      dockerfile: docker/simulator.Dockerfile
    container_name: energypulse-simulator
    environment:
      - MQTT_BROKER=tcp://mqtt-broker:1883
      - NUM_METERS=20
    depends_on:
      - mqtt-broker
    networks:
      - energypulse-network

  frontend:
    build:
      context: ./static
      dockerfile: ../docker/frontend.Dockerfile
    container_name: energypulse-frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8080
    depends_on:
      - api-gateway
    networks:
      - energypulse-network

networks:
  energypulse-network:
    driver: bridge

volumes:
  db-data:
```

**Key Features:**
- **Service Dependencies:** Ensures proper startup order
- **Volume Mounts:** Persistent database storage
- **Network Isolation:** Private Docker network
- **Environment Variables:** Configurable settings

### 8.5 Verification Checklist

After deployment, verify all components:

```bash
# Check running containers
docker-compose ps

# Expected output:
# NAME                      STATUS
# energypulse-mqtt          Up
# energypulse-api           Up
# energypulse-simulator     Up
# energypulse-frontend      Up

# View API logs
docker-compose logs -f api-gateway

# Test MQTT broker
mosquitto_sub -h localhost -t "energy/meters/+"

# Test API health
curl http://localhost:8080/health

# Test frontend
open http://localhost:3000
```

### 8.6 Troubleshooting Guide

| Issue | Possible Cause | Solution |
|-------|----------------|----------|
| Port 8080 already in use | Another service using port | `lsof -i :8080`, kill process |
| MQTT connection refused | Broker not started | Check `docker-compose logs mqtt-broker` |
| Frontend can't reach API | CORS misconfiguration | Verify CORS settings in routes.go |
| JWT token invalid | Wrong secret key | Match JWT_SECRET in .env and code |
| Database locked | Multiple instances | Stop all containers, restart |

**Common Commands:**

```bash
# Stop all services
docker-compose down

# Remove volumes (fresh start)
docker-compose down -v

# Rebuild specific service
docker-compose up --build api-gateway

# View real-time logs
docker-compose logs -f

# Enter container shell
docker exec -it energypulse-api sh
```

---

## 9. Testing and Validation

### 9.1 Unit Testing

**Test File: `internal/auth/jwt_test.go`**

```go
package auth

import (
    "testing"
    "time"
)

func TestGenerateToken(t *testing.T) {
    token, err := GenerateToken(1, "user")
    
    if err != nil {
        t.Errorf("Expected no error, got %v", err)
    }
    
    if token == "" {
        t.Error("Expected token, got empty string")
    }
}

func TestValidateToken(t *testing.T) {
    // Generate token
    token, _ := GenerateToken(1, "admin")
    
    // Validate it
    claims, err := ValidateToken(token)
    
    if err != nil {
        t.Errorf("Expected valid token, got error: %v", err)
    }
    
    if claims.UserID != 1 {
        t.Errorf("Expected user ID 1, got %d", claims.UserID)
    }
    
    if claims.Role != "admin" {
        t.Errorf("Expected role admin, got %s", claims.Role)
    }
}

func TestExpiredToken(t *testing.T) {
    // Create expired token
    claims := Claims{
        UserID: 1,
        Role:   "user",
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)),
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    tokenString, _ := token.SignedString(jwtSecret)
    
    // Try to validate
    _, err := ValidateToken(tokenString)
    
    if err == nil {
        t.Error("Expected error for expired token")
    }
}
```

**Run Tests:**
```bash
go test ./internal/auth -v
```

### 9.2 Integration Testing

**Test File: `tests/api_test.go`**

```go
package tests

import (
    "bytes"
    "encoding/json"
    "net/http"
    "testing"
)

func TestUserRegistration(t *testing.T) {
    payload := map[string]string{
        "email":    "test@example.com",
        "password": "SecurePass123",
    }
    
    body, _ := json.Marshal(payload)
    resp, err := http.Post(
        "http://localhost:8080/api/auth/register",
        "application/json",
        bytes.NewBuffer(body),
    )
    
    if err != nil {
        t.Fatal(err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusCreated {
        t.Errorf("Expected 201, got %d", resp.StatusCode)
    }
    
    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    
    if result["token"] == nil {
        t.Error("Expected token in response")
    }
}

func TestProtectedEndpoint(t *testing.T) {
    // Try without token
    resp, _ := http.Get("http://localhost:8080/api/houses")
    
    if resp.StatusCode != http.StatusUnauthorized {
        t.Errorf("Expected 401, got %d", resp.StatusCode)
    }
}
```

### 9.3 MQTT Testing

**Subscribe to All Topics:**
```bash
mosquitto_sub -h localhost -t "energy/meters/#" -v
```

**Publish Test Message:**
```bash
mosquitto_pub -h localhost \
  -t "energy/meters/test-001" \
  -m '{"meter_id":"test-001","consumption":3.5,"timestamp":1704326400}'
```

**Expected API Gateway Log:**
```
[MQTT] Received on topic: energy/meters/test-001
[MQTT] Meter test-001: 3.50 kWh
[SUCCESS] Processed reading for house 1
```

### 9.4 API Testing with curl

**Register User:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

**Get Houses (with JWT):**
```bash
curl -X GET http://localhost:8080/api/houses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Create House:**
```bash
curl -X POST http://localhost:8080/api/houses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "address": "Via Roma 10",
    "city": "Florence",
    "latitude": 43.7696,
    "longitude": 11.2558
  }'
```

### 9.5 Frontend Testing

**Test File: `static/tests/Login.test.tsx`**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Login } from '../components/Auth/Login';

test('renders login form', () => {
  render(<Login />);
  
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});

test('shows error for invalid email', () => {
  render(<Login />);
  
  const emailInput = screen.getByLabelText(/email/i);
  fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
  fireEvent.blur(emailInput);
  
  expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
});
```

**Run Frontend Tests:**
```bash
cd static
npm test
```

### 9.6 Load Testing

**Using Apache Bench:**

```bash
# Test login endpoint
ab -n 1000 -c 10 \
  -p login.json \
  -T application/json \
  http://localhost:8080/api/auth/login
```

**login.json:**
```json
{"email":"test@test.com","password":"password"}
```

**Expected Results:**
```
Requests per second: 1200-1500 [#/sec]
Time per request: 6-8 [ms] (mean)
Failed requests: 0
```

### 9.7 Test Coverage Report

```bash
# Generate coverage report
go test ./... -coverprofile=coverage.out

# View in browser
go tool cover -html=coverage.out
```

**Target Coverage:**
- Handlers: >80%
- Repository: >90%
- Auth: >95%
- Blockchain: >85%

---

## 10. Challenges and Solutions

### Challenge 1: MQTT Message Ordering

**Problem:** 
MQTT QoS 0 doesn't guarantee message order. Meter readings could arrive out of sequence, causing incorrect predictions.

**Solution:**
- Added timestamp validation in subscriber
- Implemented in-memory buffer to reorder messages
- Database query orders by timestamp, not insertion order

```go
func handleMeterReading(reading MeterReading) {
    // Validate timestamp is not too old
    now := time.Now().Unix()
    if now - reading.Timestamp > 300 { // 5 minutes
        log.Printf("Discarding old reading: %d", reading.Timestamp)
        return
    }
    
    // Continue processing...
}
```

### Challenge 2: Database Concurrency

**Problem:**
SQLite has limited concurrent write capabilities. Multiple goroutines processing MQTT messages caused database locks.

**Solution:**
- Implemented connection pooling with max connections = 1
- Used write-ahead logging (WAL mode)
- Serialized database writes through a channel

```go
// Enable WAL mode
db.Exec("PRAGMA journal_mode=WAL;")

// Connection pool
db.SetMaxOpenConns(1)
db.SetMaxIdleConns(1)
```

### Challenge 3: JWT Token Refresh

**Problem:**
Users were logged out after 24 hours with no graceful token refresh mechanism.

**Solution:**
- Frontend checks token expiration on every API call
- If token expires in <1 hour, automatically requests refresh
- Backend provides `/api/auth/refresh` endpoint

```typescript
// Token refresh logic
api.interceptors.response.use(
  async (response) => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      const expiresIn = decoded.exp - Date.now() / 1000;
      
      if (expiresIn < 3600) { // Less than 1 hour
        await refreshToken();
      }
    }
    return response;
  }
);
```

### Challenge 4: Weather API Rate Limiting

**Problem:**
OpenMeteo API has rate limits (10,000 requests/day). With 20 meters publishing every 5 seconds, we'd exceed limits quickly.

**Solution:**
- Implemented caching with 15-minute TTL
- Weather data per city, not per house
- Fallback to default values if API unavailable

```go
var weatherCache = make(map[string]*WeatherData)
var cacheMutex sync.RWMutex

func fetchWeatherData(city string) (*WeatherData, error) {
    cacheMutex.RLock()
    cached, exists := weatherCache[city]
    cacheMutex.RUnlock()
    
    if exists && time.Since(cached.FetchedAt) < 15*time.Minute {
        return cached, nil
    }
    
    // Fetch fresh data...
}
```

### Challenge 5: Docker Network Communication

**Problem:**
Containers couldn't communicate using `localhost`. Simulator couldn't reach MQTT broker.

**Solution:**
- Used Docker service names as hostnames
- Created custom bridge network
- Updated all connection strings

```yaml
# Before (doesn't work)
MQTT_BROKER=tcp://localhost:1883

# After (works)
MQTT_BROKER=tcp://mqtt-broker:1883
```

### Challenge 6: CORS in Development

**Problem:**
Frontend (localhost:3000) blocked by CORS when calling API (localhost:8080).

**Solution:**
- Configured Gin CORS middleware
- Allowed specific origins
- Enabled credentials for cookies

```go
config := cors.DefaultConfig()
config.AllowOrigins = []string{"http://localhost:3000"}
config.AllowCredentials = true
config.AllowHeaders = []string{"Authorization", "Content-Type"}
router.Use(cors.New(config))
```

---

## 11. Future Enhancements

### 11.1 Technical Improvements

1. **WebSocket Support**
   - Replace polling with real-time push notifications
   - Implement using `gorilla/websocket`
   - Notify users of new predictions instantly

2. **PostgreSQL Migration**
   - Better concurrency support
   - Advanced query optimization
   - JSON data types for flexible schemas

3. **Redis Caching Layer**
   - Cache frequent queries (user sessions, predictions)
   - Reduce database load
   - Implement distributed caching

4. **Kubernetes Deployment**
   - Replace Docker Compose with K8s
   - Auto-scaling based on load
   - Rolling updates with zero downtime

5. **GraphQL API**
   - Reduce over-fetching
   - Single endpoint for complex queries
   - Better frontend developer experience

### 11.2 Feature Additions

1. **Advanced ML Models**
   - LSTM neural networks for time-series prediction
   - Consider more features (holidays, user behavior)
   - A/B testing different models

2. **Mobile Application**
   - React Native app
   - Push notifications for price alerts
   - Offline support

3. **Energy Saving Recommendations**
   - AI-powered suggestions
   - Comparative analytics (vs neighbors)
   - Gamification with badges

4. **Integration with Real Smart Meters**
   - Support for standard protocols (Modbus, Zigbee)
   - Manufacturer SDKs integration
   - Hardware compatibility layer

5. **Multi-Tenancy Support**
   - White-label solution for utilities
   - Tenant-specific configurations
   - Isolated data per tenant

### 11.3 Security Enhancements

1. **OAuth 2.0 Integration**
   - Login with Google/Facebook
   - Reduce password management burden

2. **Two-Factor Authentication (2FA)**
   - TOTP implementation
   - SMS/Email verification

3. **API Rate Limiting**
   - Prevent abuse
   - Per-user quotas

4. **Audit Logging**
   - Track all sensitive operations
   - Compliance with GDPR

---

## 12. Conclusion

EnergyPulse successfully demonstrates the implementation of a distributed system that integrates multiple technologies and architectural patterns covered in the course. The project showcases:

**Technical Achievements:**
- Functional microservices architecture with clear separation of concerns
- Event-driven communication using MQTT for IoT data collection
- RESTful API design with comprehensive endpoints
- Secure authentication and authorization using JWT and RBAC
- Containerized deployment for platform independence
- Real-time data processing and predictive analytics

**Learning Outcomes:**
Through this project, I gained hands-on experience with:
- Designing and implementing distributed systems
- Asynchronous messaging with MQTT pub/sub
- Stateless authentication mechanisms
- Database design and ORM usage
- Docker containerization and orchestration
- Frontend-backend integration
- Security best practices

**Course Topics Integration:**
The project successfully covers all major topics from the course curriculum:
- Distributed systems fundamentals (client-server, microservices)
- Web technologies (REST, HTTP, CORS)
- Message-oriented middleware (MQTT)
- Authentication & authorization (JWT, RBAC)
- IoT sensor networks (smart meters simulation)
- Containerization (Docker, Docker Compose)
- Database management (SQLite with GORM)

**Practical Applicability:**
The EnergyPulse system could be adapted for real-world deployment with modifications such as:
- Integration with actual smart meter hardware
- Scaling to handle thousands of concurrent users
- Advanced ML models for improved prediction accuracy
- Compliance with energy sector regulations

**Personal Reflection:**
This project provided valuable experience in making architectural decisions, troubleshooting distributed systems issues, and implementing secure, scalable software. The challenges faced (e.g., database concurrency, MQTT message ordering) deepened my understanding of the complexities involved in building production-grade distributed applications.

The hybrid architecture combining event-driven (MQTT) and RESTful patterns proved effective for balancing real-time IoT data ingestion with traditional web application needs. The use of Docker Compose significantly simplified deployment and testing, demonstrating the value of containerization in modern software development.

---

## 13. References

### Technologies Documentation

1. **Go Programming Language**
   - Official Documentation: https://go.dev/doc/
   - Effective Go: https://go.dev/doc/effective_go

2. **Gin Web Framework**
   - Documentation: https://gin-gonic.com/docs/
   - GitHub Repository: https://github.com/gin-gonic/gin

3. **MQTT Protocol**
   - MQTT 3.1.1 Specification: https://docs.oasis-open.org/mqtt/mqtt/v3.1.1/
   - Eclipse Paho Go Client: https://github.com/eclipse/paho.mqtt.golang

4. **Docker & Docker Compose**
   - Docker Documentation: https://docs.docker.com/
   - Docker Compose Reference: https://docs.docker.com/compose/

5. **React**
   - Official Documentation: https://react.dev/
   - TypeScript Handbook: https://www.typescriptlang.org/docs/

### Libraries & Tools

6. **GORM (Go ORM)**
   - Documentation: https://gorm.io/docs/
   - GitHub: https://github.com/go-gorm/gorm

7. **JWT (golang-jwt)**
   - GitHub: https://github.com/golang-jwt/jwt

8. **Bcrypt**
   - Go Crypto Package: https://pkg.go.dev/golang.org/x/crypto/bcrypt

9. **Axios**
   - Documentation: https://axios-http.com/docs/intro

10. **Recharts**
    - Documentation: https://recharts.org/en-US/

### APIs

11. **OpenMeteo Weather API**
    - Documentation: https://open-meteo.com/en/docs

12. **Nominatim (OpenStreetMap)**
    - Documentation: https://nominatim.org/release-docs/latest/

### Course Materials

13. **Distributed Programming Course**
    - Università degli Studi di Firenze
    - Professor: Letterio Galletta
    - Course Repository: [Available on university platform]

### Books & Articles

14. **Designing Data-Intensive Applications**
    - Author: Martin Kleppmann
    - Topics: Distributed systems, data modeling, scalability

15. **Building Microservices**
    - Author: Sam Newman
    - Topics: Microservices architecture, service boundaries

16. **RESTful API Design Best Practices**
    - Microsoft REST API Guidelines
    - URL: https://github.com/microsoft/api-guidelines

---

## Appendices

### Appendix A: API Endpoint Reference

See `docs/API.md` for complete API documentation.

### Appendix B: Database Schema

See `docs/CORE_LOGIC.md` for detailed schema and relationships.

### Appendix C: MQTT Topic Structure

See `docs/SYSTEM_FLOW.md` for MQTT communication patterns.

### Appendix D: Code Statistics

```
Language                 Files        Lines        Code     Comments
─────────────────────────────────────────────────────────────────────
Go                          25         3,245       2,890          180
TypeScript/React            18         2,567       2,340          150
YAML (Docker)                4           245         230           10
Markdown (Docs)              6           892         850           30
SQL                          3           156         145            8
─────────────────────────────────────────────────────────────────────
Total                       56         7,105       6,455          378
```

### Appendix E: Demo Credentials

**Admin Account:**
```
Email: admin@energypulse.com
Password: admin123
```

**Regular User:**
```
Email: user@energypulse.com
Password: user123
```

---

**End of Report**

**Submitted by:** Holan Omeed Kunimohammed  
**Student ID:** 7193994  
**Date:** January 2026  
**Course:** Distributed Programming for Web, IoT and Mobile Systems  
**Professor:** Letterio Galletta
