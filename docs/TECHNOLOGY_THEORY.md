# Technology Stack & Design Theory

This document explains the **theoretical foundations** and **design decisions** behind EnergyPulse. It answers the question: *"Why did we choose these specific technologies?"*

---

## 1. MQTT (Message Queuing Telemetry Transport)

### What is it?
MQTT is a lightweight, publish-subscribe network protocol that transports messages between devices. It is the standard for IoT (Internet of Things).

### Why we used it?
*   **Decoupled Communication**: The *Smart Meter Simulator* (Publisher) doesn't need to know if the *Backend* (Subscriber) is online. It just sends data to the broker. This makes the system robust.
*   **Low Bandwidth**: MQTT headers are extremely small (2 bytes) compared to HTTP (hundreds of bytes), making it ideal for frequent meter readings (every 2 seconds).
*   **Real-Time**: Data is pushed instantly to the backend, whereas HTTP would require the backend to "poll" (ask) the meter constantly, wasting resources.

### Implementation Details
*   **Broker**: We use **Eclipse Mosquitto**, an open-source message broker.
*   **QoS 1 (At Least Once)**: We configured the system to ensure data arrives at least once. If the network fails, the broker retries.
*   **Topic Structure**: `energy/meters/{meter_id}`. This hierarchical topic allowing the backend to subscribe to `energy/meters/+` to hear *everyone*.

---

## 2. Go (Golang) Backend

### Why Go?
*   **Concurrency**: Go's *Goroutines* are perfect for handling thousands of incoming MQTT messages simultaneously. A Goroutine takes ~2KB of RAM vs ~1MB for a Java Thread.
*   **Performance**: Go is compiled to machine code, making the pricing algorithms and blockchain hashing extremely fast.
*   **Simplicity**: The standard library is robust, allowing us to build the HTTP server (Gin) and MQTT handlers in a single binary.

---

## 3. React + Vite (Frontend)

### Why a Single Page Application (SPA)?
*   **User Experience**: The page never reloads. When new data arrives, only the chart updates. This feels like a native app.
*   **Separation of Concerns**: The Frontend is purely for *display*. It contains no business logic. This allows us to scale the Frontend and Backend independently (e.g., put frontend on CDN, backend on high-CPU server).

---

## 4. Docker & Microservices

### Theoretical Concept: "Infrastructure as Code"
We defined the entire environment in `docker-compose.yml`.

### Benefits
*   **Reproducibility**: "It works on my machine" is solved. The professor runs the exact same environment as the student.
*   **Isolation**: The MQTT Broker cannot accidentally access the Backend's files. They communicate only via the network.
*   **One-Click Deployment**: The entire distributed system (4 distinct components) launches with one command.

---

## 5. Blockchain (Simulated)

### Why Blockchain for Energy?
*   **Trustlessness**: In a real grid, consumers don't trust the energy company's pricing.
*   **Immutability**: Once a transaction is hashed on the ledger, it cannot be changed. This provides a "Proof of Pricing" that can be audited later.
*   **Smart Contracts**: We simulate a contract address that validates if a reading is within acceptable bounds before confirming it.
