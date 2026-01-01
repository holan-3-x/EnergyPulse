# **EnergyPulse - Distributed Energy Price Prediction System**
### **University of Pisa - Distributed Systems Final Project**
**Student:** Holan Omeed Kunimohammed  
**Date:** January 2026

---

## **1. Application Description**

**EnergyPulse** is a distributed microservices application designed to simulate, monitor, and predict energy prices for smart households. The system emulates a real-world Smart Grid environment where "Prosumers" (consumers who produce/manage energy) can monitor their consumption in real-time, view AI-driven price forecasts, and verify the integrity of their data via a blockchain ledger.

The core problem addressed is the **dynamic pricing of energy**: providing users with real-time feedback on when energy is expensive vs. cheap, encouraging efficient usage patterns. To build trust in this automated system, every price prediction is immutable, cryptographically hashed, and auditable.

---

## **2. System Architecture**

The project follows a **Microservices-based Event-Driven Architecture**, decoupling the data generation (IoT) from the processing (Backend) and presentation (Frontend).

### **2.1. High-Level Diagram**

```
 [ IoT Simulator ]  ---> (MQTT Pub) ---> [ Mosquitto Broker ] ---> (MQTT Sub) ---> [ API Gateway / Backend ]
        |                                                                                   |
     (Generates)                                                                        (Processes)
   Voltage, Current                                                                   ML Prediction
   Consumption                                                                        Blockchain Log
                                                                                             |
                                                                                      [ SQLite DB ]
                                                                                             |
 [ React Frontend ] <--- (REST API) <--------------------------------------------------------'
```

### **2.2. Core Components**

1.  **Smart Meter Simulator (The Source):**
    *   **Technology:** Go (Golang)
    *   **Role:** Simulates physical smart meters installed in homes. It generates continuous streams of telemetry data (voltage, amperage, kWh) based on realistic household profiles (number of residents, heating type).
    *   **Communication:** Uses the **MQTT Protocol** to publish light-weight messages to the topic `energy/meters/+`.

2.  **Message Broker:**
    *   **Technology:** Eclipse Mosquitto
    *   **Role:** The central nervous system. It decouples the simulator from the backend. The simulator publishes data here, and the backend subscribes to it. This ensures that even if the backend goes down, the meters can continue reporting (QoS levels).

3.  **API Gateway & Processing Engine (The Backend):**
    *   **Technology:** Go + Gin Framework
    *   **Modules:**
        *   **MQTT Subscriber:** Actively listens to the broker for new readings.
        *   **ML Engine:** A custom logic engine that predicts the "Next Hour Price" based on current consumption and real-time weather data.
        *   **Blockchain Service:** A simulated immutable ledger. Every prediction receives a unique **Transaction Hash** (SHA-256) and Block Number, simulating an Ethereum Smart Contract interaction.
        *   **REST API:** Exposes 18+ endpoints for the frontend to consume data securely via JWT.

4.  **Frontend Dashboard:**
    *   **Technology:** React + TypeScript + Vite + TailwindCSS
    *   **Features:**
        *   **Interactive Dashboard:** Visualizes consumption vs. price trends.
        *   **Blockchain Ledger:** A fully transparent explorer to verify prediction hashes.
        *   **Admin Panel:** System health monitoring, user role management, and grid analytics.

---

## **3. Key Distributed Systems Concepts Implemented**

### **3.1. Asynchronous Messaging (MQTT)**
Instead of direct API calls, the system uses **Publish-Subscribe**. The simulator calculates data and "fires and forgets" via MQTT. The Backend processes these messages asynchronously, ensuring high scalability. If 1000 new meters are added, the backend doesn't block; it simply processes the message queue.

### **3.2. Microservices Containerization**
The entire stack is containerized using **Docker** and orchestrated via **Docker Compose**. This ensures that the complex environment (Broker + Go API + Simulator) can be spun up on any machine with a single command: `docker-compose up`.

### **3.3. Correctness & Auditability (Blockchain)**
To satisfy the requirement of "Trustless Systems," we implemented a **Simulated Blockchain**.
*   Every data point is hashed: `Hash = SHA256(Price + Consumption + Timestamp + PrevHash)`.
*   This creates a linked list of blocks where modifying an old record would invalidate the entire chain.
*   Users can verify their invoice data against this ledger to prove no tampering occurred.

### **3.4. Security (JWT + RBAC)**
*   **Stateless Authentication:** Uses JSON Web Tokens (JWT) allows the backend to be stateless and horizontally scalable.
*   **Role-Based Access Control (RBAC):** Strict separation between `Admin` (System view) and `User` (Private household view).

---

## **4. Gap Analysis and Future Work**

While the system is fully functional for the project requirements, the following areas represent simulations or potential improvements for a commercial release:

*   **MQTT Broker:** Currently requires the Docker container to be active. In a production scenario, this would be a clustered broker (e.g., HiveMQ).
*   **Blockchain:** The current implementation is an *internal* simulation. For production, this would connect to the Ethereum Mainnet or a Layer-2 solution (Polygon) using `go-ethereum`.
*   **WebSockets:** The dashboard currently polls or refreshes for data. Implementing WebSockets would push updates to the UI in true real-time (millisecond latency).

---

## **5. Conclusion**

EnergyPulse successfully demonstrates the integration of IoT data streams, distributed processing, and modern web application delivery. By rigorously applying Distributed Systems principles—decoupling, asynchronous messaging, and immutable logging—the system provides a robust framework for next-generation energy grids.
