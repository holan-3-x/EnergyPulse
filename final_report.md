# **Distributed Energy Price Prediction System**
## **Final Project Report**

**Course:** Distributed Programming for Web, IoT and Mobile Systems 2025-2026  
**University of Pisa**  
**Professor:** Letterio Galletta  
**Student:** Holan Omeed Kunimohammed  
**Student ID:** 7193994  

---

## **1. Introduction**
### **1.1 Project Scope**
The objective of this project ("EnergyPulse") is to design and implement a distributed system for the management and pricing of electrical energy in a Smart Grid environment. The system addresses the challenge of real-time data processing from distributed IoT sources (Smart Meters), algorithmic price determination, and immutable data auditing using blockchain technology.

### **1.2 Objectives**
1.  To implement a **Distributed Event-Based Architecture** using the Publish-Subscribe pattern (MQTT).
2.  To simulate a scalable network of **IoT sensors** that generate realistic telemetry data.
3.  To provide a transparent, **tamper-evident audit trail** for all pricing decisions.
4.  To verify the correctness of distributed components through a unified **Web Dashboard**.

---

## **2. Methodology**
The project adopts a **Microservices-based approach**, distinguishing clearly between the data generation layer, the message broking layer, and the business logic layer.

### **2.1 Simulation Methodology**
Instead of static data, the system employs a **stochastic simulation model** (`cmd/simulator/main.go`).
*   **Gaussian Noise**: Base consumption patterns are perturbed by random noise to simulate real-world variance.
*   **Context Awareness**: Each simulated "household" has distinct attributes (e.g., *Heat Pump* vs. *Natural Gas*, *Number of Residents*) which effectively dictate the consumption coefficients.
*   **Time-Series Generation**: Data is generated continuously (every 2 seconds) to mimic high-frequency IoT telemetry.

### **2.2 Price Prediction Logic**
The price is not random but derived deterministically from:
*   **Current Demand**: Real-time aggregation of grid load.
*   **Weather Conditions**: Temperature data fetched from *Open-Meteo API* (External Service).
*   **Usage Patterns**: Historical comparisons via a sliding window algorithm.

---

## **3. System Architecture**

### **3.1 Architectural Style**
The system implements a **Layered Event-Driven Architecture**:
1.  **Edge Layer**: Smart Meter Simulator (Go).
2.  **Messaging Layer**: Mosquitto MQTT Broker.
3.  **Service Layer**: API Gateway (Go/Gin).
4.  **Presentation Layer**: React Single Page Application (SPA).

### **3.2 Component Interaction Diagram**
```
[ Simulator ] --(MQTT Pub)--> [ Message Broker ] --(MQTT Sub)--> [ API Gateway ] --(SQL)--> [ Database ]
                                                                       ^
                                                                       | (HTTP/JSON)
                                                                       v
                                                                 [ Client App ]
```

### **3.3 Consistency & Replication**
*   **Eventual Consistency**: The system accepts a slight latency (milliseconds) between the generation of metering data and its visualization on the dashboard. This decoupling allows the Broker to buffer messages if the Backend is momentarily unavailable (Resilience).
*   **Strong Consistency (Ledger)**: The simulated blockchain module enforces strict ordering of prediction blocks, ensuring that once a price is "confirmed," it cannot be altered without invalidating the cryptographic hash chain.

---

## **4. Implementation Details**

### **4.1 Technologies Used**
*   **Language**: Go (Golang) 1.22 for all backend services (Efficiency & Concurrency).
*   **Frontend**: TypeScript + React + Vite (Type safety & Performance).
*   **Protocol**: MQTT 3.1.1 (IoT Standard) + HTTP/1.1 (Client Access).
*   **Containerization**: Docker Compose for orchestration.

### **4.2 Distributed Algorithms**
**Blockchain Hashing (Simplified Proof of Integrity):**
The system implements a local blockchain simulation to demonstrate data integrity in a distributed environment.
*   `Block[N].Hash = SHA256( Block[N].Data + Block[N-1].Hash )`
*   This creates a linked data structure. Any modification to a past prediction `Block[N-k]` would change its hash, breaking the link to `Block[N-k+1]`, thus making tampering detectable.

---

## **5. Experimental Results & Verification**

### **5.1 Verification Steps**
To validate the distributed nature of the system, the following tests were performed:
1.  **Service Isolation**: The Simulator and Backend were run in separate containers, confirming that they communicate solely via network sockets (TCP).
2.  **Fault Injection**: The Backend was terminated while the Simulator continued running. Upon restart, the Backend successfully processed the queued MQTT messages, demonstrating **Fault Tolerance**.
3.  **Cross-Verification**: Data visible in the Admin Panel was cross-referenced with the "Blockchain Ledger" view, confirming that the logged Hash matches the data presented to the user.

### **5.2 Performance**
*   **Latency**: Average end-to-end latency (Sensor -> Dashboard) was measured at `< 200ms` on local loopback.
*   **Throughput**: The Go MQTT subscriber demonstrated the capability to handle bursts of 100+ messages/second without data loss.

---

## **6. Conclusion**
The **EnergyPulse** project successfully meets the requirements of a Distributed Systems coursework. It demonstrates the ability to separate concerns, handle asynchronous data streams, and enforce data integrity using cryptographic primitives. The implementation balances academic simulation (Blockchain/IoT) with industry-standard practices (Docker/REST/MQTT), resulting in a robust, verifiable platform.
