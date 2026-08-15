# Water Quality Monitoring System (SDG 6)

A microservice-based platform that ingests water-quality sensor readings via MQTT,
evaluates them against safe thresholds, raises alerts, and displays live status on a dashboard.

## Services
- **backend-api** – REST API (Express + PostgreSQL), port 4000
- **sensor-ingestion** – MQTT subscriber that writes readings to the database
- **alert-service** – background worker that evaluates readings against thresholds
- **frontend-dashboard** – static dashboard served via nginx, port 3000
- **postgres-db** – PostgreSQL database, port 5432
- **mqtt-broker** – Eclipse Mosquitto broker, port 1883

## Run locally

```bash
cp .env.example .env
docker compose up --build -d
docker compose ps
```

Open the dashboard: http://localhost:3000
Check API health: http://localhost:4000/health

## Send a test sensor reading

```bash
docker exec -it wqm-mqtt mosquitto_pub -t wqm/sensors/source12/readings \
  -m '{"ph":9.2,"turbidity":12,"tds":300,"chlorine":0.1,"temperature":26}'
```

This reading violates pH, turbidity, and chlorine thresholds — within a few seconds
`alert-service` will log an alert and it will appear on the dashboard.

## Stop the stack

```bash
docker compose down
```
