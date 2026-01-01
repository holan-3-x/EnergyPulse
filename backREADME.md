# EnergyPulse - Energy Price Prediction System

**Course:** Distributed Programming for Web, IoT and Mobile Systems 2025-2026  
**Professor:** Letterio Galletta  
**Student:** Holan Omeed Kunimohammed (7193994)

## 📋 Project Overview

EnergyPulse is a production-ready energy price prediction system that demonstrates key concepts from the distributed systems course:

- **MQTT** - IoT smart meter data collection (Paho library)
- **REST API** - 18 endpoints using Gin framework
- **Blockchain** - Immutable prediction logging (simulated)
- **Authentication** - JWT tokens with bcrypt password hashing
- **Microservices** - API Gateway + MQTT Simulator

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│                    http://localhost:3000                         │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     API Gateway (Go + Gin)                       │
│                    http://localhost:8080                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Auth       │  │  Houses     │  │ Predictions │              │
│  │  Handlers   │  │  Handlers   │  │  Handlers   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          ▼                                       │
│                   ┌─────────────┐                                │
│                   │   SQLite    │                                │
│                   │  Database   │                                │
│                   └─────────────┘                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ MQTT Subscribe
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    MQTT Broker (Mosquitto)                       │
│                    tcp://localhost:1883                          │
└──────────────────────────────────────────────────────────────────┘
                              ▲
                              │ MQTT Publish
                              │
┌──────────────────────────────────────────────────────────────────┐
│                  Smart Meter Simulator (Go)                      │
│                    20 simulated IoT meters                       │
└──────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Go 1.21+
- Docker (optional, for MQTT broker)

### Option 1: Run Locally

```bash
# Clone and enter directory
cd energy-prediction

# Install dependencies
go mod tidy

# Run the API server
go run ./cmd/api-gateway

# Server starts at http://localhost:8080
```

### Option 2: Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Option 3: Use Makefile

```bash
make deps    # Install dependencies
make run     # Run API server
make test    # Run tests
make clean   # Clean build artifacts
```

## 🔑 Demo Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | password123 | Admin |
| mario | password123 | User |
| luigi | password123 | User |
| anna | password123 | User |
| giorgio | password123 | User |
| francesca | password123 | User |

## 📡 API Endpoints

### Authentication (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account with house |
| POST | `/auth/login` | Get JWT token |
| POST | `/auth/logout` | Invalidate session |
| POST | `/auth/refresh` | Refresh token |

### User Management (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get current user |
| PUT | `/api/user/profile` | Update profile |
| PUT | `/api/user/password` | Change password |

### House Management (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/houses` | Create house |
| GET | `/api/houses` | List houses |
| GET | `/api/houses/:id` | Get house |
| PUT | `/api/houses/:id` | Update house |
| DELETE | `/api/houses/:id` | Archive house |

### Predictions (Protected)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/predictions` | List predictions |
| GET | `/api/predictions/:id` | Get prediction |
| GET | `/api/statistics` | Get statistics |

### Admin (Protected + Admin Role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List all users |
| PUT | `/admin/users/:id/role` | Change user role |
| GET | `/admin/dashboard` | System statistics |

### Health (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/status` | System status |

## 📊 Database Schema

### Tables (5 total)

1. **users** - User accounts with bcrypt hashed passwords
2. **sessions** - Active JWT sessions
3. **households** - Houses with smart meter IDs
4. **predictions** - Energy price predictions
5. **blockchain_log** - Blockchain transaction records

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8080 | API server port |
| DB_PATH | data/energy.db | SQLite database path |
| MQTT_BROKER | tcp://localhost:1883 | MQTT broker URL |
| MQTT_TOPIC | energy/meters/+ | MQTT subscription topic |
| JWT_SECRET | (default) | JWT signing secret |

### Example .env file

```env
PORT=8080
DB_PATH=data/energy.db
MQTT_BROKER=tcp://localhost:1883
JWT_SECRET=your-super-secret-key-change-in-production
```

## 📁 Project Structure

```
energy-prediction/
├── cmd/
│   ├── api-gateway/main.go      # API server entry point
│   └── simulator/main.go        # MQTT simulator
├── internal/
│   ├── auth/                    # JWT + bcrypt
│   │   ├── jwt.go
│   │   ├── password.go
│   │   └── middleware.go
│   ├── blockchain/              # Blockchain simulation
│   │   └── client.go
│   ├── database/                # GORM + SQLite
│   │   ├── connection.go
│   │   └── seeds.go
│   ├── handlers/                # HTTP handlers
│   │   ├── auth.go
│   │   ├── user.go
│   │   ├── households.go
│   │   ├── predictions.go
│   │   └── admin.go
│   ├── ml/                      # ML model
│   │   └── model.go
│   ├── models/                  # Data structures
│   │   ├── user.go
│   │   ├── household.go
│   │   └── prediction.go
│   └── mqtt/                    # MQTT client
│       └── subscriber.go
├── docker/                      # Docker files
├── data/                        # Database (auto-created)
├── static/                      # Frontend files
├── docker-compose.yml
├── Makefile
├── go.mod
└── README.md
```

## 🎯 Course Topic Alignment

| Lecture Topic | Implementation |
|---------------|----------------|
| **Go Programming** | All backend code, goroutines, channels |
| **MQTT** | Smart meter simulator + subscriber |
| **REST API** | 18 endpoints with Gin framework |
| **Authentication** | JWT tokens + bcrypt passwords |
| **Blockchain** | Simulated Ethereum logging |
| **Database** | SQLite with GORM ORM |
| **Microservices** | API Gateway + Simulator |

## 🧪 Testing

```bash
# Run all tests
go test -v ./...

# Run with coverage
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

## 📄 API Usage Examples

### Register a New User

```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "houseName": "My House",
    "address": "Via Test 1",
    "city": "Milano",
    "country": "Italy",
    "members": 2,
    "areaSqm": 80,
    "yearBuilt": 2020
  }'
```

### Login

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "mario",
    "password": "password123"
  }'
```

### Get Houses (with token)

```bash
curl http://localhost:8080/api/houses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Predictions

```bash
curl "http://localhost:8080/api/predictions?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📝 License

MIT License - Educational Project

## 🙏 Acknowledgments

- Professor Letterio Galletta for course guidance
- Anthropic's Claude for development assistance
- The Go community for excellent libraries
