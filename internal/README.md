# Internal Application Code (`internal`)

This directory holds the private library code for the EnergyPulse project. Following Go conventions, code inside `internal` cannot be imported by external projects, enforcing encapsulation.

## Packages

- **`auth/`**: JWT authentication logic, password hashing, and role-based access control.
- **`blockchain/`**: Client logic for interacting with the simulated Ethereum layer (or stubbed verification).
- **`database/`**: SQLite connection setup and migration logic (GORM).
- **`handlers/`**: HTTP request controllers for Gin routes (API endpoints).
- **`ml/`**: Energy price prediction logic and simple regression models.
- **`models/`**: Data structures defining the schema (Users, Houses, Readings, etc.).
- **`mqtt/`**: MQTT client logic for publishing and subscribing to energy topics.
- **`weather/`**: Integration with external Weather APIs (e.g., OpenMeteo) for forecast data.
