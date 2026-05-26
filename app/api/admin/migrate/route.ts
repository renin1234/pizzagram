import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-session";
import { sql } from "@/lib/db";

export async function GET(req: Request) {
  return POST(req);
}

export async function POST(req: Request) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone      TEXT UNIQUE NOT NULL,
        name       TEXT,
        address    TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS otp_codes (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone      TEXT NOT NULL,
        code       TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used       BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS otp_codes_phone_idx ON otp_codes (phone)
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id    UUID REFERENCES users (id),
        lines      JSONB NOT NULL,
        total      INTEGER NOT NULL,
        address    TEXT,
        payment    TEXT NOT NULL,
        status     TEXT DEFAULT 'new',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS pending_orders (
        id         TEXT PRIMARY KEY,
        data       JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    const tables = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `;

    return NextResponse.json({
      ok: true,
      tables: tables.map((r) => r.table_name),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
