# **Critical Analysis & System Evaluation**
### **Distributed Systems Final Project - EnergyPulse**
**Student:** Holan Omeed Kunimohammed  

---

## **1. Compliance with Distributed Systems Principles**

This project was built to satisfy the rigorous requirements of a modern Distributed Systems architecture. Below is the mapping of theoretical concepts to concrete code implementation.

### **1.1. Decoupling & Transparency**
*   **Concept:** Components should not rely on the internal state of others.
*   **Implementation:** The `Simulator` and `API Gateway` run as completely independent processes (OS-level isolation). 
    *   **Access Transparency:** The Simulator does not know it is talking to a Go backend; it simply publishes to an MQTT topic `energy/meters/+`.
    *   **Location Transparency:** The backend does not know where the meters are located; it simply subscribes to the broker.

### **1.2. Asynchronous Communication (Event-Driven)**
*   **Concept:** Systems should use non-blocking message passing for scalability.
*   **Code Evidence:** `internal/mqtt/subscriber.go`
    *   The system uses the **MQTT Protocol** (Message Queuing Telemetry Transport). 
    *   This allows the Backend to process high-velocity data streams without holding open 1000+ HTTP connections.
    *   **QoS (Quality of Service):** We rely on the Broker to handle message delivery guarantees.

### **1.3. Fault Tolerance & Resilience**
*   **Concept:** The system should continue to function if one part fails.
*   **Analysis:**
    *   **Broker Failure:** If the API Gateway crashes, the MQTT Broker queues the meter messages. When the Gateway restarts, it picks up the missed messages (Persistent Session).
    *   **Partial Availability:** If the ML Engine fails to predict a price, the system falls back to the last known price/data, ensuring the UI never breaks (Graceful Degradation).

### **1.4. Data Integrity & Verification (Blockchain)**
*   **Concept:** Trustless verification in a distributed environment.
*   **Code Evidence:** `internal/blockchain/client.go`
    *   We implemented a **Linked-List Hash Chain**.
    *   `Block[N].Hash = SHA256(Block[N].Data + Block[N-1].Hash)`
    *   This provides a **Tamper-Evident Logs** property. Users don't need to trust the "Admin"; they can cryptographically verify that their invoice inputs haven't been retroactively changed.

---

## **2. Architectural Assessment**

### **2.1. The "Simulator" Paradox**
**Critique:** While the architecture allows for thousands of real meters, we are currently using a software simulator (`cmd/simulator`).
**Defense:** This is standard for academic projects. The Simulator generates **realistic noise** (Gaussian distribution) and **context-aware data** (Heating type, Residents), making the data stream distinguishable from random noise. This proves the ML Engine's ability to handle complex patterns.

### **2.2. Consistency Model**
**Critique:** The system primarily uses **Eventual Consistency**.
**Defense:** For energy monitoring, strict consistency (ACID) across all nodes instantly is unnecessary and performance-prohibitive. We accept that the Dashboard might be 500ms behind the Meter. The Blockchain provides **Strong Consistency** for the *historical record* once a block is mined.

---

## **3. Codebase Metrics**

| Metric | Count | Description |
|:---|:---:|:---|
| **Microservices** | 2 | API Gateway, Simulator |
| **API Endpoints** | 18 | Coverage of Auth, Data, Admin, Blockchain |
| **Database Tables** | 5 | Users, Households, Predictions, Blocks, Sessions |
| **MQTT Topics** | Dynamic | `energy/meters/{meter_id}` |

---

## **4. Conclusion for Evaluation**

**EnergyPulse** is not just a web app; it is a **Distributed control loop**.
1.  **Sense:** Meters generate data (Simulator).
2.  **Transmit:** Data flows via Broker (MQTT).
3.  **Decide:** Backend analyzes and prices (ML/Go).
4.  **Act:** User adjusts consumption based on Dashboard (React).

This closed-loop system fulfills the advanced requirements of the course by demonstrating widely used industrial patterns (CQRS-lite, Event Sourcing via MQTT, and Immutable Audit Trails).
