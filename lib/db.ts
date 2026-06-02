import postgres from "postgres";

let _client: ReturnType<typeof postgres> | null = null;

function getClient() {
  if (_client) return _client;
  const url = process.env.TIMEWEB_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL не задан в переменных окружения");
  _client = postgres(url, { max: 1, idle_timeout: 20, connect_timeout: 60, ssl: false, connection: { connect_timeout: "60" } });
  return _client;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sql = (strings: TemplateStringsArray, ...values: unknown[]) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (getClient() as any)(strings, ...values);
