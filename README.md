# EnergyPulse - Distributed Energy Price Prediction System

**Course:** Distributed Programming for Web, IoT and Mobile Systems 2025-2026  
**Professor:** Letterio Galletta  
**Student:** Holan Omeed Kunimohammed (7193994)

---

## 📋 Project Overview

EnergyPulse is a production-ready energy price prediction system that demonstrates key concepts from the distributed systems course. It simulates a Smart Grid environment where "Prosumers" monitor consumption, receive AI-driven price forecasts, and verify data integrity via a blockchain ledger.

### **Core Demonstrated Concepts**
- **MQTT (Pub/Sub)**: Decoupled IoT communication using the Paho library and Mosquitto broker.
- **Microservices Architecture**: Separate services for API Gateway, Simulation, and Message Broking.
- **RESTful API**: 18+ endpoints built with the Gin framework.
- **Digital Twins**: Simulation of 20+ smart meters with realistic usage profiles.
- **Blockchain**: Immutable transaction logging for data verification (Simulated Ethereum Layer).
- **Authentication**: Stateless JWT security with Role-Based Access Control (RBAC).

---

## 📚 Detailed Documentation

For a deep dive into how the system works, please refer to:
*   **[System Flow & Architecture](docs/SYSTEM_FLOW.md)**: Explains the Hybrid Event-Driven/REST architecture.
*   **[API Documentation](docs/API.md)**: Full list of backend endpoints (Auth, Houses, Predictions).
*   **[Core Logic Deep Dive](docs/CORE_LOGIC.md)**: Explanations of ML Algorithms, Blockchain Hashing, and DB Schema.
*   **[Final Report](final_report.md)**: Comprehensive academic report detailing methodology and results.

---

## 🏗️ System Architecture

The system follows an Event-Driven Architecture:

```
┌──────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│                    http://localhost:3000                         │
└──────────────────────────────────────────────────────────────────┘
                              │ REST API
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     API Gateway (Go + Gin)                       │
│                    http://localhost:8080                         │
│  [Auth] [Houses] [Predictions] [Blockchain] [Admin] [Weather]    │
│  └────────────────────────────────────────────────────────────┘  │
│         │                │                │                      │
│         └────────────────┼────────────────┘                      │
│                          ▼                                       │
│                   ┌─────────────┐                                │
│                   │   SQLite    │                                │
│                   │  Database   │                                │
│                   └─────────────┘                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              │ MQTT Subscribe (Topic: energy/meters/+)
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

---

## 🚀 Quick Start

You can run the full system using Docker (Recommended) or locally.

### Prerequisites
- [Go 1.22+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org/)
- [Docker & Docker Compose](https://www.docker.com/)

### Option 1: Docker (Full System)
Run the entire stack including the MQTT broker in isolated containers.

```bash
docker-compose up --build
```
docker-compose up --build
```
Access the dashboard at [http://localhost:3000](http://localhost:3000).
*Note: The Frontend uses port 3000, API uses 8080, MQTT uses 1883.*

### Option 2: Local Development (Manual Start)
If you want to debug individual components:

1. **Start MQTT Broker (Required):**
   ```bash
   docker-compose up -d mqtt
   ```

2. **Start Backend API:**
   ```bash
   go run cmd/api-gateway/main.go
   ```

3. **Start Simulator:**
   ```bash
   go run cmd/simulator/main.go
   ```

4. **Start Frontend:**
   ```bash
   cd static && npm run dev
   ```

---

## 🔑 Login Credentials

The system comes pre-seeded with these accounts:

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | `admin@energypulse.it` | `password123` | System Dashboard, User Management |
| **User** | `mario.rossi@email.it` | `password123` | Personal House, Predictions |
| **User** | `luigi.verdi@email.it` | `password123` | Personal House, Predictions |

---

## 🧪 Key Application Features (Exam Demo)

1.  **Distributed IoT Simulation**: 
    - Observations: Check the terminal logs of the `simulator`. It pushes data every 2 seconds.
    - Verification: Backend logs `Received data from meter...`

2.  **Blockchain Verification**:
    - Go to **Blockchain Ledger** in the sidebar.
    - Copy a **Transaction Hash** from the table.
    - Paste it into the **Transaction Verifier** at the top.
    - Result: The system cryptographically verifies the record exists and hasn't been tampered with.

3.  **Admin Capabilities**:
    - Login as Admin.
    - View **System Households** to see all data across the grid.
    - Change user roles or delete households.

4.  **Resilience**:
    - Stop the backend (`Ctrl+C`). The Simulator continues publishing to MQTT (Broker queues messages).
    - Restart backend. It reconnects and resumes processing.

---

## 📁 Project Structure

```
energy-prediction/
├── cmd/
│   ├── api-gateway/         # Main Backend Entrypoint
│   └── simulator/           # IoT Smart Meter Simulator
├── internal/
│   ├── blockchain/          # Ledger Implementation
│   ├── handlers/            # HTTP Controllers
│   ├── ml/                  # Price Prediction Logic
│   ├── models/              # Data Structs (GORM)
│   ├── mqtt/                # Pub/Sub Logic
│   └── weather/             # OpenMeteo Integration
├── static/                  # React Frontend (Vite)
├── docker/                  # Docker Configs
├── docker-compose.yml       # Orchestration
└── go.mod                   # Dependencies
```

---

## 📝 License
MIT License - Educational Project for Distributed Systems Course.
