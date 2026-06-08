import { Pool } from "pg";

let _pool: Pool | null = null;

function getPool() {
  if (_pool) return _pool;
  const url = process.env.TIMEWEB_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL не задана в переменных окружения");

  _pool = new Pool({
    connectionString: url,
    max: 3,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 60_000,
    ssl: { rejectUnauthorized: false },
  });

  _pool.on("error", (err) => {
    console.error("PostgreSQL pool error:", err);
  });

  return _pool;
}

function buildQuery(strings: TemplateStringsArray, values: unknown[]) {
  let text = strings[0] ?? "";
  for (let i = 0; i < values.length; i++) {
    text += `$${i + 1}${strings[i + 1] ?? ""}`;
  }
  return { text, values };
}

export async function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  const query = buildQuery(strings, values);
  const result = await getPool().query(query.text, query.values);
  return result.rows;
}
