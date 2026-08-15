const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "water_quality",
  port: 5432,
});

// Safe thresholds (simplified WHO/BIS style ranges)
const THRESHOLDS = {
  ph: { min: 6.5, max: 8.5 },
  turbidity: { max: 5 },
  chlorine: { min: 0.2 },
};

async function evaluate() {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM readings WHERE evaluated = false ORDER BY id ASC"
    );

    for (const r of rows) {
      const reasons = [];
      if (r.ph !== null && (r.ph < THRESHOLDS.ph.min || r.ph > THRESHOLDS.ph.max)) {
        reasons.push(`pH ${r.ph} out of safe range`);
      }
      if (r.turbidity !== null && r.turbidity > THRESHOLDS.turbidity.max) {
        reasons.push(`Turbidity ${r.turbidity} exceeds safe limit`);
      }
      if (r.chlorine !== null && r.chlorine < THRESHOLDS.chlorine.min) {
        reasons.push(`Residual chlorine ${r.chlorine} below safe minimum`);
      }

      if (reasons.length > 0) {
        await pool.query(
          `INSERT INTO alerts (source_id, reading_id, reason, severity)
           VALUES ($1,$2,$3,$4)`,
          [r.source_id, r.id, reasons.join("; "), "critical"]
        );
        console.log(`ALERT for source "${r.source_id}": ${reasons.join("; ")}`);
      }

      await pool.query("UPDATE readings SET evaluated = true WHERE id = $1", [r.id]);
    }
  } catch (err) {
    console.error("alert-service evaluation error:", err.message);
  }
}

console.log("alert-service started, evaluating new readings every 5 seconds...");
setInterval(evaluate, 5000);
