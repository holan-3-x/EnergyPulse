# Command Directory (`cmd`)

This directory contains the main entry points for the EnergyPulse applications.

## Applications

### 1. API Gateway (`api-gateway`)
The core backend service that handles HTTP requests, authentication, and manages the system.

**Run locally:**
```bash
go run cmd/api-gateway/main.go
```

### 2. Smart Meter Simulator (`simulator`)
A standalone service that mimics 20+ smart meters, generating energy consumption data and publishing it to the MQTT broker.

**Run locally:**
```bash
go run cmd/simulator/main.go
```
