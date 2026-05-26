-- Pizzagram — Neon (Vercel Postgres) schema
-- Run once after creating the database in Vercel Dashboard → Storage → Postgres

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT UNIQUE NOT NULL,
  name        TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL,
  code        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS otp_codes_phone_idx ON otp_codes (phone);

CREATE TABLE IF NOT EXISTS orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users (id),
  lines       JSONB NOT NULL,
  total       INTEGER NOT NULL,
  address     TEXT,
  payment     TEXT NOT NULL,
  status      TEXT DEFAULT 'new',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Temporary storage for YooKassa payment flow.
-- payment/route.ts inserts; payment-webhook/route.ts reads + deletes.
CREATE TABLE IF NOT EXISTS pending_orders (
  id          TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Housekeeping: delete abandoned pending orders after 24 h.
-- Run periodically or add a cron job:
-- DELETE FROM pending_orders WHERE created_at < NOW() - INTERVAL '24 hours';
