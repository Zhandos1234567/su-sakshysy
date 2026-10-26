-- Су сақшысы: PostgreSQL schema
CREATE TABLE IF NOT EXISTS water_daily (
  id BIGSERIAL PRIMARY KEY,
  log_date DATE NOT NULL UNIQUE,
  amount_ml INTEGER NOT NULL DEFAULT 0 CHECK (amount_ml >= 0),
  goal_ml INTEGER NOT NULL DEFAULT 2000 CHECK (goal_ml BETWEEN 250 AND 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS water_events (
  id BIGSERIAL PRIMARY KEY,
  log_date DATE NOT NULL,
  amount_ml INTEGER NOT NULL CHECK (amount_ml BETWEEN 1 AND 5000),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_water_events_log_date ON water_events(log_date);
