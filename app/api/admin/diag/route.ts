import { NextResponse } from "next/server";
import net from "net";

export async function GET(req: Request) {
  const dbUrl = process.env.TIMEWEB_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  const parsed = dbUrl ? new URL(dbUrl) : null;
  const host = parsed?.hostname ?? "85.239.43.6";
  const port = parsed ? parseInt(parsed.port || "5432") : 5432;

  // Get Vercel outbound IP
  let outboundIp = "unknown";
  try {
    const r = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(5000) });
    const j = await r.json() as { ip: string };
    outboundIp = j.ip;
  } catch {}

  // TCP connect attempts (x5)
  const attempts: { attempt: number; ok: boolean; ms?: number; error?: string }[] = [];
  for (let i = 1; i <= 5; i++) {
    const result = await new Promise<{ ok: boolean; ms?: number; error?: string }>((resolve) => {
      const start = Date.now();
      const socket = new net.Socket();
      socket.setTimeout(8000);
      socket.connect(port, host, () => {
        const ms = Date.now() - start;
        socket.destroy();
        resolve({ ok: true, ms });
      });
      socket.on("timeout", () => { socket.destroy(); resolve({ ok: false, error: "timeout 8s" }); });
      socket.on("error", (err) => resolve({ ok: false, error: err.message }));
    });
    attempts.push({ attempt: i, ...result });
  }

  return NextResponse.json({
    target: `${host}:${port}`,
    db_url_set: !!dbUrl,
    vercel_region: process.env.VERCEL_REGION ?? "unknown",
    vercel_outbound_ip: outboundIp,
    attempts,
    summary: attempts.every(a => !a.ok) ? "ALL ATTEMPTS FAILED" : "SOME OK",
  });
}
