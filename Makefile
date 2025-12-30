# Makefile for EnergyPulse - Energy Price Prediction System
# This provides convenient commands for building and running the project

.PHONY: all build run clean test deps api simulator docker help

# Default target
all: deps build

# Install dependencies
deps:
	@echo "📦 Installing Go dependencies..."
	go mod tidy
	go mod download
	@echo "✓ Dependencies installed"

# Build all binaries
build: build-api build-simulator
	@echo "✓ All binaries built successfully"

build-api:
	@echo "🔨 Building API Gateway..."
	go build -o bin/api-gateway ./cmd/api-gateway
	@echo "✓ API Gateway built: bin/api-gateway"

build-simulator:
	@echo "🔨 Building Simulator..."
	go build -o bin/simulator ./cmd/simulator
	@echo "✓ Simulator built: bin/simulator"

# Run the API server
run: run-api

run-api:
	@echo "🚀 Starting API Gateway..."
	go run ./cmd/api-gateway

# Run the simulator (requires MQTT broker)
run-simulator:
	@echo "🚀 Starting Smart Meter Simulator..."
	go run ./cmd/simulator

# Run both in separate terminals (use tmux or separate terminals)
run-all:
	@echo "To run the full system:"
	@echo "  Terminal 1: make run-api"
	@echo "  Terminal 2: make run-simulator"
	@echo "  Terminal 3: docker run -p 1883:1883 eclipse-mosquitto"

# Clean build artifacts
clean:
	@echo "🧹 Cleaning..."
	rm -rf bin/
	rm -f data/energy.db
	@echo "✓ Cleaned"

# Run tests
test:
	@echo "🧪 Running tests..."
	go test -v ./...

# Run tests with coverage
test-coverage:
	@echo "🧪 Running tests with coverage..."
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "✓ Coverage report: coverage.html"

# Format code
fmt:
	@echo "📝 Formatting code..."
	go fmt ./...
	@echo "✓ Code formatted"

# Lint code
lint:
	@echo "🔍 Linting code..."
	go vet ./...
	@echo "✓ Lint complete"

# Start Mosquitto MQTT broker (Docker)
mqtt-broker:
	@echo "🐳 Starting Mosquitto MQTT broker..."
	docker run -d --name mosquitto -p 1883:1883 eclipse-mosquitto
	@echo "✓ MQTT broker running on localhost:1883"

# Stop MQTT broker
mqtt-stop:
	@echo "🛑 Stopping Mosquitto..."
	docker stop mosquitto
	docker rm mosquitto
	@echo "✓ MQTT broker stopped"

# Docker build
docker-build:
	@echo "🐳 Building Docker images..."
	docker build -f docker/Dockerfile.api -t energypulse-api .
	docker build -f docker/Dockerfile.simulator -t energypulse-simulator .
	@echo "✓ Docker images built"

# Docker compose up
docker-up:
	@echo "🐳 Starting all services with Docker Compose..."
	docker-compose up -d
	@echo "✓ Services started"

# Docker compose down
docker-down:
	@echo "🐳 Stopping all services..."
	docker-compose down
	@echo "✓ Services stopped"

# Create project structure
init:
	@echo "📁 Creating project directories..."
	mkdir -p data bin static docs
	@echo "✓ Directories created"

# Help
help:
	@echo "EnergyPulse - Energy Price Prediction System"
	@echo ""
	@echo "Available commands:"
	@echo "  make deps          - Install Go dependencies"
	@echo "  make build         - Build all binaries"
	@echo "  make run           - Run the API server"
	@echo "  make run-simulator - Run the smart meter simulator"
	@echo "  make test          - Run tests"
	@echo "  make clean         - Clean build artifacts"
	@echo "  make mqtt-broker   - Start MQTT broker (Docker)"
	@echo "  make docker-up     - Start all services (Docker Compose)"
	@echo "  make docker-down   - Stop all services"
	@echo "  make help          - Show this help"
	@echo ""
	@echo "Quick Start:"
	@echo "  1. make deps"
	@echo "  2. make run"
	@echo "  3. Open http://localhost:8080"
