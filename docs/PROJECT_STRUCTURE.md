# Project File Structure

This document provides a detailed map of the codebase to help you navigate the project.

---

## 📂 Root Directory

| File/Folder | Description |
| :--- | :--- |
| **`cmd/`** | Application entry points (Main functions). |
| **`internal/`** | Private application code (Business Logic). |
| **`static/`** | Frontend source code (React + Vite). |
| **`docker/`** | Dockerfile configurations for each service. |
| **`docs/`** | Project documentation. |
| **`data/`** | Persistent storage for SQLite database. |
| `docker-compose.yml` | Orchestration file to run the full system. |
| `go.mod` / `go.sum` | Go dependency definitions. |
| `Makefile` | Shortcuts for common commands. |
| `README.md` | Main project entry point. |
| `final_report.md` | Academic report for the exam. |

---

## 📂 Backend Structure (`internal/`)

The Go backend is organized by "Domain":

```
internal/
├── auth/           # JWT Token generation & Hashing
├── blockchain/     # Simulated Ledger Implementation
├── database/       # SQLite connection & Seeding logic
├── handlers/       # HTTP API Controllers (Gin)
├── ml/             # Price Prediction Algorithms
├── models/         # Database Structs (GORM)
├── mqtt/           # IoT Message Subscriber logic
└── weather/        # External Weather API client
```

---

## 📂 Frontend Structure (`static/`)

The React application follows a standard Vite structure:

```
static/
├── components/     # Reusable UI widgets
├── pages/          # Full page views (Dashboard, Login, etc.)
├── services/       # API calling functions (Axios)
├── App.tsx         # Main Routing logic
└── vite.config.ts  # Build configuration
```

---

## 📂 Docker Structure (`docker/`)

```
docker/
├── Dockerfile.api        # Go Backend image
├── Dockerfile.simulator  # Go Simulator image
├── Dockerfile.frontend   # Node.js/React image
└── mosquitto.conf        # MQTT Broker config
```

---

## 📂 Documentation (`docs/`)

*   **`API.md`**: REST API Endpoint reference.
*   **`CORE_LOGIC.md`**: Deep dive into ML, Blockchain, and DB logic.
*   **`SYSTEM_FLOW.md`**: Architecture diagrams and data flow.
*   **`TECHNOLOGY_THEORY.md`**: Justification of tech stack choices.
*   **`PROJECT_STRUCTURE.md`**: This file.
