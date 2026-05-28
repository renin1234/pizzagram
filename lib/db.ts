/**
 * Server-side only. Neon serverless Postgres client.
 * sql() is called lazily (inside request handlers, not at module load time)
 * so the build succeeds even without DATABASE_URL in the build environment.
 */
import { neon } from "@neondatabase/serverless";

// Wrapper: creates neon instance on first actual query, not at import time.
// This prevents "No database connection string" errors during Next.js build.
export const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
  const url = process.env.TIMEWEB_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL не задан в переменных окружения");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return neon(url)(strings, ...(values as any[]));
};
