import { NextResponse } from "next/server";
import net from "net";
import { Client } from "pg";

export async function GET() {
  const dbUrl = process.env.TIMEWEB_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  const parsed = dbUrl ? new URL(dbUrl) : null;
  const host = parsed?.hostname ?? "85.239.43.6";
  const port = parsed ? parseInt(parsed.port || "5432") : 5432;

  // TCP connect test
  const tcpResult = await new Promise<{ ok: boolean; ms?: number; error?: string }>((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(8000);
    socket.connect(port, host, () => { socket.destroy(); resolve({ ok: true, ms: Date.now() - start }); });
    socket.on("timeout", () => { socket.destroy(); resolve({ ok: false, error: "TCP timeout 8s" }); });
    socket.on("error", (err) => resolve({ ok: false, error: err.message }));
  });

  // pg test without SSL
  let pgNoSsl: { ok: boolean; ms?: number; error?: string } = { ok: false, error: "not run" };
  if (dbUrl) {
    const start = Date.now();
    const client = new Client({ connectionString: dbUrl, ssl: false, connectionTimeoutMillis: 9000 });
    try {
      await client.connect();
      pgNoSsl = { ok: true, ms: Date.now() - start };
      await client.end();
    } catch (err) {
      pgNoSsl = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // pg test with SSL
  let pgSsl: { ok: boolean; ms?: number; error?: string } = { ok: false, error: "not run" };
  if (dbUrl) {
    const start = Date.now();
    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 9000 });
    try {
      await client.connect();
      pgSsl = { ok: true, ms: Date.now() - start };
      await client.end();
    } catch (err) {
      pgSsl = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  return NextResponse.json({
    target: `${host}:${port}`,
    tcp: tcpResult,
    pg_no_ssl: pgNoSsl,
    pg_with_ssl: pgSsl,
  });
}
