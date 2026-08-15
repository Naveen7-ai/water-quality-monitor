CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    source_id TEXT NOT NULL,
    ph NUMERIC,
    turbidity NUMERIC,
    tds NUMERIC,
    chlorine NUMERIC,
    temperature NUMERIC,
    recorded_at TIMESTAMP DEFAULT now(),
    evaluated BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    source_id TEXT NOT NULL,
    reading_id INTEGER REFERENCES readings(id),
    reason TEXT,
    severity TEXT,
    created_at TIMESTAMP DEFAULT now()
);
