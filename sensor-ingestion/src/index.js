const mqtt = require("mqtt");
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "water_quality",
  port: 5432,
});

const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
const client = mqtt.connect(brokerUrl);

client.on("connect", () => {
  console.log(`sensor-ingestion connected to MQTT broker at ${brokerUrl}`);
  client.subscribe("wqm/sensors/+/readings", (err) => {
    if (err) console.error("subscribe error", err);
    else console.log("subscribed to wqm/sensors/+/readings");
  });
});

client.on("message", async (topic, message) => {
  try {
    const parts = topic.split("/"); // wqm/sensors/<source_id>/readings
    const source_id = parts[2];
    const data = JSON.parse(message.toString());

    await pool.query(
      `INSERT INTO readings (source_id, ph, turbidity, tds, chlorine, temperature)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [source_id, data.ph, data.turbidity, data.tds, data.chlorine, data.temperature]
    );
    console.log(`Inserted reading for source "${source_id}":`, data);
  } catch (err) {
    console.error("ingestion error:", err.message);
  }
});

client.on("error", (err) => console.error("MQTT connection error:", err.message));
