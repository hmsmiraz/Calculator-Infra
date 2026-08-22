-- ── Users ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100)        NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255)        NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ── Calculations ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS calculations (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  operand_a  NUMERIC      NOT NULL,
  operand_b  NUMERIC      NOT NULL,
  operator   VARCHAR(1)   NOT NULL,
  result     NUMERIC      NOT NULL,
  expression VARCHAR(255) NOT NULL,
  operation  VARCHAR(50)  NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON calculations(user_id);

-- ── Auto-update updated_at ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
