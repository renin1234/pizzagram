import { sql } from "@/lib/db";

const TABLE_READY: { value: boolean } = { value: false };

export function hasJsonStoreDatabase(): boolean {
  return Boolean(process.env.TIMEWEB_DATABASE_URL ?? process.env.DATABASE_URL);
}

async function ensureTable() {
  if (TABLE_READY.value) return;
  await sql`
    CREATE TABLE IF NOT EXISTS app_json_store (
      key TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  TABLE_READY.value = true;
}

export async function readJsonValue<T>(key: string): Promise<T | null> {
  if (!hasJsonStoreDatabase()) return null;
  try {
    await ensureTable();
    const rows = await sql`
      SELECT data
      FROM app_json_store
      WHERE key = ${key}
      LIMIT 1
    `;
    return rows.length ? (rows[0].data as T) : null;
  } catch (err) {
    console.error(`JSON store read failed for ${key}:`, err);
    return null;
  }
}

export async function writeJsonValue<T>(key: string, data: T): Promise<void> {
  if (!hasJsonStoreDatabase()) {
    throw new Error("DATABASE_URL is not configured for JSON storage");
  }

  await ensureTable();
  await sql`
    INSERT INTO app_json_store (key, data, updated_at)
    VALUES (${key}, ${JSON.stringify(data)}::jsonb, NOW())
    ON CONFLICT (key)
    DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
  `;
}
