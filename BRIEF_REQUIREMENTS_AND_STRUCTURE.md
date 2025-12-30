# ENERGY PRICE PREDICTION SYSTEM
## Brief Requirements & Clean File Structure

**Course:** Distributed Programming for Web, IoT and Mobile Systems  
**Professor:** Letterio Galletta  
**Student:** Holan Omeed Kunimohammed (7193994)  
**Goal:** Production-ready MVP aligned to course lectures  

---

## 📋 SYSTEM REQUIREMENTS (BRIEF)

### Functional Requirements

**User Management:**
- User registration with username, password, email
- User login with JWT token generation
- User profile management (name, phone, avatar)
- Two roles: admin (see all) and user (see own)
- Session management (24-hour token validity)

**House Management:**
- Users register house details during signup
- House information: address, city, heating type, area, members, year built
- Users can create, read, update, delete houses
- Each house linked to one smart meter (automatic assignment)

**Predictions:**
- MQTT receives data from 20 smart meters (households)
- ML model predicts hourly electricity prices
- Predictions saved with: timestamp, consumption, predicted price, confidence
- Users see only own predictions; admins see all

**Blockchain:**
- Each prediction logged on Ethereum (immutable proof)
- Transaction hash stored in database
- Verification link shown to user

**Real-time Updates:**
- WebSocket for live price updates
- Dashboard shows latest predictions as they arrive

---

### Non-Functional Requirements

- **Performance:** API response < 500ms
- **Reliability:** 99% uptime
- **Scalability:** Microservices architecture (can scale independently)
- **Security:** bcrypt passwords, JWT tokens, input validation
- **Testing:** Unit + integration tests required
- **Documentation:** API docs, database schema, architecture diagram

---

## 🏗️ CLEAN FILE STRUCTURE

```
energy-prediction/
│
├── README.md                        [Setup & running instructions]
│
├── cmd/                             [Executable entry points]
│   ├── api-gateway/
│   │   └── main.go                 [User + House management API (Port 8080)]
│   │
│   ├── prediction-service/
│   │   └── main.go                 [MQTT + ML + Blockchain (Port 8081)]
│   │
│   └── simulator/
│       └── main.go                 [MQTT simulator - 20 smart meters]
│
├── internal/                        [Private Go packages]
│   │
│   ├── models/                     [Data structures]
│   │   ├── user.go                 [User, Session, Claims]
│   │   ├── household.go            [Household]
│   │   └── prediction.go           [Prediction, PredictionInput/Output]
│   │
│   ├── database/                   [SQLite operations]
│   │   ├── connection.go           [DB pool & Connect()]
│   │   ├── migrations.go           [CreateTables()]
│   │   └── queries.go              [All CRUD operations]
│   │
│   ├── auth/                       [Authentication & security]
│   │   ├── jwt.go                  [GenerateToken(), ValidateToken()]
│   │   ├── password.go             [HashPassword(), VerifyPassword()]
│   │   └── middleware.go           [JWTMiddleware(), RoleMiddleware()]
│   │
│   ├── mqtt/                       [IoT messaging]
│   │   ├── subscriber.go           [Receive data from smart meters]
│   │   └── publisher.go            [Send simulated meter data]
│   │
│   ├── ml/                         [Machine learning]
│   │   ├── model.go                [Decision tree wrapper]
│   │   ├── trainer.go              [Train on historical data]
│   │   └── predictor.go            [Make price predictions]
│   │
│   ├── blockchain/                 [Ethereum integration]
│   │   └── client.go               [gRPC to smart contract]
│   │
│   ├── handlers/                   [HTTP endpoint handlers]
│   │   ├── auth.go                 [Register, Login, Logout]
│   │   ├── households.go           [House CRUD]
│   │   ├── predictions.go          [Get predictions, stats]
│   │   └── admin.go                [Admin endpoints]
│   │
│   └── utils/                      [Utilities]
│       ├── logger.go               [Structured logging]
│       ├── validation.go           [Input validation]
│       └── errors.go               [Error types]
│
├── frontend/                        [React web application]
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx         [Landing page]
│   │   │   ├── Register.jsx        [Registration (4 steps)]
│   │   │   ├── Login.jsx           [Login page]
│   │   │   ├── Dashboard.jsx       [Main dashboard]
│   │   │   ├── HouseDetails.jsx    [House page with graph]
│   │   │   ├── Predictions.jsx     [Predictions table]
│   │   │   ├── Profile.jsx         [User profile]
│   │   │   └── AdminDash.jsx       [Admin dashboard]
│   │   │
│   │   ├── components/
│   │   │   ├── NavBar.jsx          [Navigation]
│   │   │   ├── HouseCard.jsx       [House display card]
│   │   │   ├── PredictionChart.jsx [Price prediction graph]
│   │   │   └── ConsumptionGauge.jsx[Real-time consumption]
│   │   │
│   │   ├── services/
│   │   │   ├── api.js              [Axios API client]
│   │   │   ├── auth.js             [Login, register, logout]
│   │   │   ├── houses.js           [House CRUD]
│   │   │   ├── predictions.js      [Get predictions]
│   │   │   └── websocket.js        [Real-time updates]
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.js      [Auth state management]
│   │   │
│   │   ├── App.jsx                 [Main app component]
│   │   └── main.jsx                [Entry point]
│   │
│   ├── package.json                [Dependencies]
│   └── vite.config.js              [Build config]
│
├── contracts/                       [Smart contracts]
│   ├── EnergyPricePredictions.sol  [Solidity contract]
│   └── deploy.js                   [Hardhat deployment]
│
├── data/                           [Runtime data]
│   ├── training_data.csv           [ML training data (8760 records)]
│   └── energy.db                   [SQLite database (auto-created)]
│
├── tests/                          [Automated tests]
│   ├── unit/
│   │   ├── auth_test.go           [JWT, bcrypt tests]
│   │   ├── ml_test.go             [Model prediction tests]
│   │   └── household_test.go      [House operations tests]
│   │
│   └── integration/
│       ├── api_test.go            [API endpoint tests]
│       ├── mqtt_test.go           [MQTT flow tests]
│       └── full_flow_test.go      [End-to-end tests]
│
├── docker/                         [Docker images]
│   ├── Dockerfile.api              [API Gateway container]
│   ├── Dockerfile.prediction       [Prediction Service container]
│   └── Dockerfile.simulator        [Simulator container]
│
├── go.mod                          [Go module definition]
├── go.sum                          [Go dependencies lock]
│
├── docker-compose.yml              [All services + MQTT + DB]
├── .env.example                    [Configuration template]
│
└── docs/                           [Documentation]
    ├── API.md                      [18 REST endpoints]
    ├── DATABASE.md                 [5 tables schema]
    ├── ARCHITECTURE.md             [System design]
    ├── MQTT.md                     [MQTT flow]
    ├── ML.md                       [ML model]
    └── BLOCKCHAIN.md               [Smart contract]
```

---

## 📊 DATABASE SCHEMA (5 Tables)

```
users
├─ id (PK)
├─ username (UNIQUE)
├─ password_hash
├─ email (UNIQUE)
├─ first_name, last_name, phone
├─ role (admin/user)
└─ created_at, updated_at

households
├─ id (PK: house_001, house_002, ...)
├─ user_id (FK)
├─ house_name, address, city, region, country
├─ household_members, heating_type, area_sqm, year_built
├─ meter_id (household_1 to household_20)
├─ status (active/archived)
└─ created_at

predictions
├─ id (PK)
├─ user_id (FK)
├─ house_id (FK)
├─ meter_id
├─ timestamp, hour, temperature
├─ consumption_kwh
├─ predicted_price, confidence
├─ blockchain_tx (UNIQUE)
├─ blockchain_confirmed
└─ created_at

sessions
├─ id (PK)
├─ user_id (FK)
├─ token (UNIQUE)
├─ expires_at
└─ created_at

blockchain_log
├─ id (PK)
├─ prediction_id (FK)
├─ transaction_hash (UNIQUE)
├─ block_number, gas_used, status
├─ contract_address
├─ logged_at, confirmed_at
```

---

## 🔗 API ENDPOINTS (18 Total)

**Authentication (Public)**
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh

**User Management (Protected)**
- GET /api/user/profile
- PUT /api/user/profile
- PUT /api/user/password

**House Management (Protected)**
- POST /api/houses
- GET /api/houses
- GET /api/houses/:house_id
- PUT /api/houses/:house_id
- DELETE /api/houses/:house_id

**Predictions (Protected)**
- GET /api/predictions
- GET /api/predictions/:prediction_id
- GET /api/statistics

**Admin Only (Protected + Admin)**
- GET /admin/users
- PUT /admin/users/:user_id/role
- GET /admin/dashboard

**Health (Public)**
- GET /health
- GET /status

---

## 🛠️ TECHNOLOGY STACK

| Purpose | Technology | Version |
|---------|-----------|---------|
| Backend | Go | 1.21+ |
| REST API | Gin | v1.9+ |
| Database | SQLite | 3.35+ |
| Authentication | JWT | v5+ |
| Password Hash | bcrypt | (stdlib) |
| MQTT | Paho MQTT | v1.4+ |
| MQTT Broker | Mosquitto | 2.0+ |
| ML | golearn | Latest |
| RPC | gRPC | v1.56+ |
| Blockchain | go-ethereum | v1.13+ |
| Smart Contract | Solidity | 0.8+ |
| Frontend | React | 18+ |
| Frontend HTTP | Axios | Latest |
| Frontend Real-time | Socket.io | Latest |

---

## 🎯 ALIGNMENT TO LECTURES

| Lecture Topic | Your Project Use | File Location |
|---------------|------------------|---------------|
| **MQTT_in_Go** | Smart meter data collection | cmd/simulator, internal/mqtt/ |
| **REST API** | 18 endpoints for client interaction | cmd/api-gateway, internal/handlers/ |
| **gRPC** | Smart contract calls | internal/blockchain/client.go |
| **Blockchain** | Immutable prediction logging | contracts/, internal/blockchain/ |
| **Network Programming** | MQTT, REST, gRPC protocols | internal/mqtt/, handlers/, blockchain/ |
| **Authentication** | JWT + bcrypt security | internal/auth/ |
| **Synchronization** | Real-time WebSocket updates | internal/websocket/ |
| **Microservices** | API Gateway + Prediction Service | cmd/api-gateway, cmd/prediction-service |

---

## 📈 SCOPE BALANCE

**✅ NOT TOO SIMPLE:**
- Real ML model (decision tree)
- Blockchain integration (Ethereum)
- MQTT IoT simulation (20 meters)
- Microservices (2 services)
- Real-time updates (WebSocket)
- Complete React frontend

**✅ NOT TOO COMPLEX:**
- SQLite (not PostgreSQL setup)
- Go only (no other languages)
- Simple decision tree ML (not deep learning)
- Local Ganache blockchain (not real Ethereum)
- 18 endpoints (not 100+)
- No authentication providers (JWT only)

**Result:** Perfect for exam + real-world deployment

---

## 📅 REALISTIC TIMELINE

| Week | Focus | Days |
|------|-------|------|
| 1 | Database, models, user auth | 5 |
| 2 | Houses, predictions, admin | 5 |
| 3 | MQTT, ML, real-time | 5 |
| 4 | Blockchain, frontend | 5 |
| 5 | Testing, docs, polish | 5 |

**Total: 25 days @ 3-4 hours/day = 75-100 hours**

---

## ✅ DELIVERABLES

### Code
- ✅ API Gateway (Go)
- ✅ Prediction Service (Go)
- ✅ Frontend (React)
- ✅ Smart Contract (Solidity)
- ✅ MQTT Simulator (Go)
- ✅ Unit + integration tests

### Documentation
- ✅ README.md
- ✅ API.md (18 endpoints)
- ✅ DATABASE.md
- ✅ ARCHITECTURE.md
- ✅ MQTT.md
- ✅ ML.md
- ✅ BLOCKCHAIN.md

### Setup
- ✅ docker-compose.yml
- ✅ .env.example
- ✅ go.mod
- ✅ frontend package.json

---

## 🎓 EVALUATION CRITERIA

**Code Quality (40%)**
- Clean structure ✓
- Error handling ✓
- No hardcoded secrets ✓
- Design patterns ✓

**Functionality (30%)**
- User registration & login ✓
- MQTT data flow ✓
- ML predictions ✓
- Blockchain logging ✓
- Admin/user access ✓

**Understanding (20%)**
- Can explain JWT flow ✓
- Can explain MQTT ✓
- Can explain ML ✓
- Can explain blockchain ✓

**Documentation (10%)**
- README ✓
- API docs ✓
- Database schema ✓
- Architecture ✓

---

## 🚀 QUICK START

1. **Read this file** (understand requirements & structure)
2. **Create project:** `mkdir energy-prediction && cd energy-prediction`
3. **Init Go:** `go mod init github.com/yourname/energy-prediction`
4. **Create structure:** Follow the file structure above
5. **Start coding:** Begin with Week 1 (database + auth)
6. **Follow timeline:** 3-4 hours per day for 25 days
7. **Test & document:** As you build
8. **Demo:** Show professor working system

---

## 📝 SUMMARY

**What:** Production-ready energy price prediction system  
**Tech:** Go + React + MQTT + ML + Blockchain  
**Size:** 2 services, 18 APIs, 5 tables, 8 frontend pages  
**Time:** 25 days @ 3-4 hours/day  
**Scope:** Perfect balance (not too simple, not too complex)  
**Grade:** A+ guaranteed ✓

---

**You're ready. Start today. Good luck! 💪**
