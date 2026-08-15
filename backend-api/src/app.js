const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// Basic CORS so the dashboard (different port) can call this API
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "water_quality",
  port: 5432,
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/readings", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM readings ORDER BY recorded_at DESC LIMIT 50"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to fetch readings" });
  }
});

app.post("/readings", async (req, res) => {
  try {
    const { source_id, ph, turbidity, tds, chlorine, temperature } = req.body;
    const result = await pool.query(
      `INSERT INTO readings (source_id, ph, turbidity, tds, chlorine, temperature)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [source_id, ph, turbidity, tds, chlorine, temperature]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to insert reading" });
  }
});

app.get("/alerts", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to fetch alerts" });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`backend-api listening on port ${PORT}`));
