# EnergyPulse - Smart Energy Prediction System

A comprehensive Distributed Energy Resource (DER) management system with AI-driven price prediction, IoT smart meter simulation, and blockchain auditing.

## 🚀 Quick Start (Local Development)

The easiest way to run the full system including Frontend, Backend, and MQTT Simulation.

**Prerequisites:**
- [Go 1.22+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org/)

**1. Start the System:**
Open your terminal and run the all-in-one start script:
```bash
./start.sh
```
This script will automatically:
- Start the Go Backend Server (API Gateway)
- Start the Smart Meter Simulator
- Start the React Frontend

**2. Access the Application:**
- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **API Documentation:** [http://localhost:8080](http://localhost:8080)

---

## 🐳 Running with Docker (Recommended for Full Demo)

Run the entire stack (including real MQTT Broker) in isolated containers.

**1. Start Containers:**
```bash
docker-compose up --build
```

**2. Access:**
Everything runs on **localhost:8080** (Backend) and **localhost:5173** (Frontend).

---

## � Login Credentials

Use these pre-configured accounts for testing:

| Role | Email | Password |
|------|-------|----------|
| **User** | `mario.rossi@email.it` | `password123` |
| **Admin** | `admin@energypulse.it` | `password123` |

---

## 🛠️ System Components

### 1. Frontend (React + TypeScript)
- **Dashboard:** Real-time energy & price monitoring.
- **Admin Panel:** User management & system analytics.
- **Blockchain Ledger:** Immutable transaction audit trail.
- **Weather Integration:** Live weather data impacting energy usage.

### 2. Backend (Go / Gin)
- **API Gateway:** RESTful API for all system operations.
- **MQTT Service:** Ingests real-time data from smart meters.
- **ML Engine:** Predicts energy prices based on usage & weather.
- **Blockchain Simulator:** Logs all predictions for verification.

### 3. Simulation
- **Simulator Service:** Generates realistic usage patterns for active houses.
- **Smart Logic:** Uses weather + house details (insulation, residents) to vary data.

## 🧪 Testing Features for Exam

1. **Verify Blockchain:** Go to `/blockchain` -> Copy any transaction hash -> Click **Verify**.
2. **Admin Power:** Login as Admin -> Go to Admin Panel -> View Analytics -> Change User Roles.
3. **Add House:** Go to Houses -> Click **Register New Household** -> Search City (OSM) -> Submit.
4. **Interactive Graph:** Go to any House Detail -> Hover over the graph to see **Price vs. Consumption**.
