/**
 * Server-side only. Neon serverless Postgres client.
 * Requires DATABASE_URL in environment.
 * Set via Vercel Postgres integration or .env.local for local dev.
 */
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set — database features will fail");
}

export const sql = neon(process.env.DATABASE_URL ?? "");
