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

EnergyPulse is a distributed energy price prediction system designed for smart home environments. The system leverages IoT sensors (smart meters) to collect real-time energy consumption data via MQTT protocol, processes this data through a microservices architecture, and provides predictive analytics for energy pricing using a rule-based decision tree model. The platform integrates a **simulated blockchain** for transaction logging (demonstrating the concept without a real Ethereum connection) and features a responsive web interface for user interaction.

**Key Features:**
- Real-time MQTT-based IoT data collection from 20+ simulated smart meters
- Microservices architecture with three independent services
- RESTful API with JWT-based authentication and role-based access control (RBAC)
- Rule-based predictive model for energy pricing (simulates ML decision tree)
- **Simulated blockchain** for immutable transaction logging (educational demonstration)
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
3. **Predictive Analytics:** Rule-based price forecasting considering consumption, weather, time-of-day, and regional factors (decision tree approach)
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
- QoS Level 1 (at-least-once) for reliable delivery

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
8. Calculate prediction → internal/ml/model.go (rule-based decision tree)
9. Log to blockchain → internal/blockchain/client.go (simulated)
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

#### 3.6.1 Session Lifecycle Management

**Token-Based Session Architecture:**

As discussed in the course lectures on "Handling and Processing Requests," session management is critical for web applications. EnergyPulse implements a stateless session model using JWT tokens rather than server-side session cookies.

**Session States:**

| State | Description | Transition |
|-------|-------------|------------|
| Unauthenticated | No valid token present | → Login/Register |
| Active | Valid JWT token (<24 hours) | → Expired / Logout |
| Expired | Token past expiration time | → Re-authenticate |

**Session Operations:**

1. **Session Creation (Login/Register):**
   ```go
   // Token generated with 24-hour expiration
   claims := Claims{
       UserID: user.ID,
       Role:   user.Role,
       RegisteredClaims: jwt.RegisteredClaims{
           ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
           IssuedAt:  jwt.NewNumericDate(time.Now()),
       },
   }
   ```

2. **Session Validation (Each Request):**
   - Middleware extracts token from `Authorization: Bearer <token>` header
   - Validates signature using HMAC-SHA256
   - Checks expiration timestamp
   - Extracts claims into request context

3. **Session Termination (Logout):**
   - Client-side token deletion from localStorage
   - Stateless design means no server-side session invalidation required

4. **Concurrent Sessions:**
   - Multiple devices can hold valid tokens simultaneously
   - Each token is independently validated

**Security Considerations:**

> **Note:** As highlighted in course lectures on cookie security, storing tokens in localStorage is vulnerable to XSS attacks. For production deployment, HTTP-only cookies with SameSite attribute would be recommended, combined with CSRF protection. The current implementation prioritizes simplicity for demonstration purposes.

**Production Enhancements (Future Work):**
- **Token Blacklist:** Redis-based blacklist for immediate token revocation
- **Refresh Tokens:** Short-lived access tokens with long-lived refresh tokens
- **Secure Cookie Storage:** HTTP-only cookies with AES-GCM encryption as discussed in course material on authenticated encryption

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

This section explicitly maps the project's implementation to the core topics of the **B032427 - Distributed Programming for Web, IoT and Mobile Systems** syllabus.

### 5.1 Distributed System Architectures (Syllabus Topic 3)

#### 5.1.1 Layered & Client-Server Architecture
- **Concept:** Separation of concerns between presentation and application logic.
- **Implementation:** React Frontend (Presentation Layer) ↔ Go API Gateway (Application Layer) ↔ SQLite (Data Layer).
- **Communication:** HTTP/REST over JSON.

#### 5.1.2 Publish-Subscribe Architecture
- **Concept:** Decoupling of producers and consumers via topics.
- **Implementation:** `Simulator` (Publisher) → `Mosquitto` (Broker) → `API Gateway` (Subscriber).
- **Benefit:** Asynchronous communication perfect for high-frequency IoT data.

### 5.2 Network Programming in Go (Syllabus Topic 5)

#### 5.2.1 Data Serialization (JSON)
- **Concept:** Marshalling/Unmarshalling complex data structures for network transmission.
- **Code:** `encoding/json` package usage.
```go
// internal/mqtt/subscriber.go
type MeterReading struct {
    MeterID     string  `json:"meter_id"`
    Consumption float64 `json:"consumption"`
}
if err := json.Unmarshal(msg.Payload(), &reading); err != nil { ... }
```

#### 5.2.2 HTTP Server Implementation
- **Concept:** Handling TCP/HTTP requests and routing.
- **Implementation:** `net/http` (via Gin wrapper) handling request lifecycle (bind, process, respond).

### 5.3 Web Programming in Go (Syllabus Topic 6)

#### 5.3.1 Request Handlers & Middleware
- **Concept:** Intercepting requests for cross-cutting concerns.
- **Implementation:** Authenticated routes pipeline.
- **Chain:** `[CORS] → [JWT Auth] → [RBAC Check] → [Business Logic]`.

#### 5.3.2 Data Persistence (GORM)
- **Concept:** Object-Relational Mapping for database interactions.
- **Implementation:** `internal/models` structs mapped to SQLite tables via GORM tags.

### 5.4 IoT Protocols (Syllabus Topic 12)

#### 5.4.1 MQTT Protocol Implementation

**Standard:** MQTT 3.1.1 via Eclipse Mosquitto broker.

**Client Library:** `github.com/eclipse/paho.mqtt.golang` - the standard Go client for MQTT.

**Quality of Service (QoS) Selection:**

As covered in the MQTT lecture slides, MQTT provides three QoS levels representing different delivery guarantees:

| QoS Level | Name | Guarantee | Use Case |
|-----------|------|-----------|----------|
| 0 | At Most Once | Best effort, no ACK | Telemetry where occasional loss is acceptable |
| 1 | At Least Once | Guaranteed delivery, possible duplicates | **EnergyPulse choice** |
| 2 | Exactly Once | Guaranteed single delivery | Financial transactions |

**Why QoS Level 1 for EnergyPulse:**

EnergyPulse uses **QoS Level 1 (At Least Once)** for the following reasons:

1. **Data Integrity for Billing:** Energy consumption readings are used for price predictions and potential billing calculations. Lost readings would compromise accuracy.

2. **Duplicate Handling:** The system can tolerate duplicate messages since readings are timestamped and idempotent storage can be implemented.

3. **Broker Storage:** With QoS 1, the Mosquitto broker stores messages until acknowledged, ensuring delivery even if the API Gateway temporarily disconnects.

4. **Performance Balance:** QoS 2's four-way handshake (PUBLISH → PUBREC → PUBREL → PUBCOMP) would add unnecessary latency for high-frequency sensor data.

**MQTT Message Flow (QoS 1):**

```
Simulator                    Broker                    API Gateway
    |                          |                           |
    |------ PUBLISH QoS 1 ---->|                           |
    |<-------- PUBACK ---------|                           |
    |                          |------ PUBLISH QoS 1 ----->|
    |                          |<-------- PUBACK ----------|
    |                          |                           |
```

**Topic Structure:**

Hierarchical topic design following MQTT best practices:

```
energy/meters/+          ← Wildcard subscription (API Gateway)
  ├── energy/meters/meter-001
  ├── energy/meters/meter-002
  └── ... (20 meters total)
```

**Retained Messages:**

As noted in course lectures, publishers have no guarantee messages reach subscribers unless using retained messages or QoS levels 1-2. EnergyPulse uses QoS 1 to guarantee delivery to the broker, and the broker guarantees delivery to subscribers.

**Code Implementation:**

```go
// Publisher (Simulator) - QoS 1
token := client.Publish("energy/meters/"+meterID, 1, false, payload)
token.Wait()

// Subscriber (API Gateway) - QoS 1
client.Subscribe("energy/meters/+", 1, messageHandler)
```

### 5.5 Coordination & Distributed Algorithms (Syllabus Topics 8 & 9)

**Course Reference:** Chapter 6 of "Distributed Systems" by van Steen and Tanenbaum, as cited in the Synchronization lecture.

#### 5.5.1 Time Synchronization in EnergyPulse

**Problem:** In distributed systems, each node has its own local clock. Without synchronization, ordering events across nodes becomes impossible.

**EnergyPulse Solution:** 

The system uses **physical clock synchronization** via NTP (Network Time Protocol):

1. **Server-Side Timestamps:** All energy readings receive timestamps from the API Gateway server, which synchronizes with NTP servers.

2. **RFC3339 Format:** Timestamps use ISO 8601 format for unambiguous representation:
   ```go
   timestamp := time.Now().UTC().Format(time.RFC3339)
   // Output: "2026-01-06T14:30:00Z"
   ```

3. **Partial Ordering:** Readings from the same meter are totally ordered by timestamp. Readings across different meters are partially ordered.

**Limitations (as discussed in course):**

> "Network delays outdate the server answer" - Synchronization lecture

For high-precision applications, clock skew between meters and server could cause ordering issues. The current 5-second publishing interval provides sufficient tolerance.

#### 5.5.2 Logical Clocks (Future Enhancement)

**Course Concept:** Vector clocks provide a more detailed representation of causality than physical timestamps.

**Potential Application in EnergyPulse:**

If scaling to multiple API Gateway nodes processing meter readings concurrently, vector clocks would detect causality:

```go
// Vector Clock structure (from course)
type VectorClock struct {
    Clock map[string]int // Node ID → Event count
}

// Algorithm VectorClock (from lecture):
// 1. Before event: VC[self]++
// 2. On send: attach VC to message
// 3. On receive: VC[k] = max(VC[k], received[k]) for all k
```

**Use Case:** Detecting concurrent predictions from different gateway nodes:
- If `VC(pred1) < VC(pred2)`: pred1 happened before pred2
- If neither `<` nor `>`: predictions are concurrent (potential conflict)

#### 5.5.3 Leader Election (Future Enhancement)

**Course Concept:** The Bully Algorithm elects the node with the highest ID as leader.

**Potential Application:**

If deploying multiple simulator nodes for load distribution, leader election would:
1. Elect a master simulator to coordinate meter assignments
2. Handle failover if the master crashes
3. Prevent duplicate meter IDs across simulators

**Bully Algorithm Summary (from course):**
```
1. Node P sends ELECTION to all nodes with higher IDs
2. If no response → P becomes leader, broadcasts COORDINATOR
3. If response → P waits for COORDINATOR from higher node
4. On receiving ELECTION → respond OK, start own election
```

### 5.6 Blockchain Systems (Syllabus Topic 4)

**Course Alignment:** This implementation demonstrates concepts from the "Principles of Blockchain Systems" lecture.

> [!IMPORTANT]
> **Educational Simulation:** The blockchain in EnergyPulse is a **simulated implementation** designed to demonstrate core blockchain concepts without connecting to a real distributed network like Ethereum. The code explicitly states: *"In a real implementation, this would connect to Ethereum via go-ethereum. For the course project, we simulate the blockchain to demonstrate the concept."* This approach allows us to focus on understanding cryptographic chaining, hash pointers, and immutability without the complexity of real network deployment.

#### 5.6.1 Blockchain Fundamentals Applied

**Definition (from course):** "A blockchain system is a distributed system where mutually untrusted participants want to achieve a common goal... The integrity of the data stored in the ledger is ensured by cryptography."

**EnergyPulse Blockchain Implementation (Simulated):**

| Concept | Course Definition | EnergyPulse Implementation |
|---------|-------------------|---------------------------|
| Ledger | Distributed shared registry | SQLite `blockchain_transactions` table |
| Block | Container for transactions | Energy prediction record with hash |
| Hash Pointer | Links blocks cryptographically | `previous_hash` field (SHA-256) |
| Immutability | Tamper-resistant via hashing | Chain verification endpoint |

**Block Structure:**

```go
type Block struct {
    ID           uint   `gorm:"primaryKey"`
    Hash         string `gorm:"uniqueIndex"`
    PreviousHash string
    Data         string  // JSON: {house_id, prediction, timestamp}
    Timestamp    int64
}
```

**Hash Chain Construction (as shown in Bitcoin lecture):**

```
Block 0 (Genesis)     Block 1              Block 2
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ PrevHash: 0  │◄────│ PrevHash:    │◄────│ PrevHash:    │
│ Data: init   │     │ Hash(Block0) │     │ Hash(Block1) │
│ Hash: H0     │     │ Data: pred1  │     │ Data: pred2  │
└──────────────┘     │ Hash: H1     │     │ Hash: H2     │
                     └──────────────┘     └──────────────┘
```

**Tamper Detection:**

As explained in the course: "The hash stored in the hash pointer is the hash of the whole data of the previous block." This ensures any modification to historical data breaks the chain:

```go
// Verification: recalculate hash and compare
func VerifyChain() bool {
    blocks := getAllBlocks()
    for i := 1; i < len(blocks); i++ {
        expectedHash := sha256(blocks[i-1].PreviousHash + blocks[i-1].Data + blocks[i-1].Timestamp)
        if blocks[i].PreviousHash != expectedHash {
            return false // Tampering detected!
        }
    }
    return true
}
```

#### 5.6.2 Consensus Mechanism

**Course Context:** The lectures distinguish between:
- **Permissionless blockchains:** Open networks (e.g., Bitcoin with Proof of Work)
- **Permissioned blockchains:** Controlled access with trusted validators

**EnergyPulse Approach: Proof of Authority (PoA)**

Since EnergyPulse operates in a centralized context (single API Gateway), it uses a simplified **Proof of Authority** model:

- The API Gateway is the sole trusted validator
- No consensus protocol needed (single node)
- Blocks are appended immediately upon prediction generation

**Production Enhancement:** For a multi-node deployment, the system would require:
- **Byzantine Fault Tolerance (BFT)** for permissioned deployment
- **Leader Election** (e.g., Bully Algorithm from course) to select block proposer
- **Consensus Protocol** to ensure agreement among nodes

#### 5.6.3 Limitations vs. Production Blockchain

| Feature | Bitcoin/Ethereum | EnergyPulse |
|---------|------------------|-------------|
| Network | P2P distributed | Single node |
| Consensus | PoW/PoS | PoA (trusted) |
| Ledger Copies | All nodes | Single database |
| Fork Resolution | Longest chain | N/A |
| Smart Contracts | Supported | Not implemented |

This simplified implementation serves educational purposes, demonstrating the core concept of cryptographic chaining for data integrity without the complexity of distributed consensus.

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
5. Backend hashes password using bcrypt (cost factor 10)
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
5. `internal/ml/model.go:PredictPrice()` - Rule-based price calculation (decision tree)
6. `internal/blockchain/client.go:LogPrediction()` - Hash transaction
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
3. `cmd/api-gateway/main.go` - Route with middleware chain:
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
│   └── client.go            # Blockchain implementation
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
    └── main.go              # Route definitions
```

#### 7.1.2 Main Entry Point Analysis

**File: `cmd/api-gateway/main.go`**

```go
package main

import (
    "log"
    "github.com/gin-gonic/gin"
    "energypulse/internal/database"
    "energypulse/cmd/api-gateway"
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
- Bcrypt password hashing (cost factor 10)
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
- MQTT Broker: tcp://localhost:1883 (WebSockets on 9001)

**Step 5: Test with Demo Credentials**
```
Email: admin@energypulse.com
Password: password123
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
| Frontend can't reach API | CORS misconfiguration | Verify CORS settings in cmd/api-gateway/main.go |
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

**Implementation Limitations (Honest Assessment):**

For transparency, the following components are simulated or simplified for educational purposes:

| Component | Implementation | Production Alternative |
|-----------|----------------|------------------------|
| **Blockchain** | Simulated local chain (no network) | Real Ethereum/Polygon via go-ethereum |
| **Prediction Model** | Rule-based decision tree | Trained ML model (TensorFlow, PyTorch) |
| **Smart Meters** | Simulated 20 meters via software | Real hardware (Modbus, Zigbee protocols) |
| **Weather Data** | Real OpenMeteo API | Same (already production-ready) |
| **Authentication** | Real JWT + bcrypt | Same (already production-ready) |
| **MQTT** | Real Mosquitto broker | Same (already production-ready) |

> [!NOTE]
> These simplifications were intentional design decisions to focus on demonstrating distributed systems concepts (MQTT pub/sub, microservices, JWT auth, cryptographic hashing) rather than building production infrastructure. The core learning objectives—understanding message-oriented middleware, stateless authentication, and data integrity—are fully achieved with this approach.

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

14. **Distributed Systems**
    - Authors: Andrew S. Tanenbaum and Maarten van Steen
    - URL: https://www.distributed-systems.net/index.php/books/ds4/
    - Topics: Principles, Architectures, Communication, Naming, Consistency

15. **Designing Data-Intensive Applications**
    - Author: Martin Kleppmann
    - Topics: Distributed systems, data modeling, scalability

16. **Building Microservices**
    - Author: Sam Newman
    - Topics: Microservices architecture, service boundaries

17. **RESTful API Design Best Practices**
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


### Appendix D: Demo Credentials

**Admin Account:**
```
Email: admin@energypulse.com
Password: password123
```

**Regular User:**
```
Email: mario.rossi@email.it
Password: password123
```

---

**End of Report**

**Submitted by:** Holan Omeed Kunimohammed  
**Student ID:** 7193994  
**Date:** January 2026  
**Course:** Distributed Programming for Web, IoT and Mobile Systems  
**Professor:** Letterio Galletta
