# Docker Configuration (`docker`)

This directory contains the `Dockerfile` definitions for containerizing the individual components of the EnergyPulse system.

## Files

- **`Dockerfile.api`**: Builds the Go `api-gateway` binary.
- **`Dockerfile.simulator`**: Builds the Go `simulator` binary.
- **`Dockerfile.frontend`**: Builds the React `static` frontend (using Vite/Nginx).
- **`mosquitto.conf`**: Configuration file for the Mosquitto MQTT broker.

## Orchestration

The system is orchestrated using the `docker-compose.yml` file located in the root directory.

**Run full system:**
```bash
docker-compose up --build
```
