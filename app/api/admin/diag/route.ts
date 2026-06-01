import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-session";
import net from "net";

export async function GET(req: Request) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const host = "85.239.62.55";
  const port = 5432;
  const timeout = 10000;

  const result = await new Promise<{ ok: boolean; ms?: number; error?: string }>((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.connect(port, host, () => {
      const ms = Date.now() - start;
      socket.destroy();
      resolve({ ok: true, ms });
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve({ ok: false, error: "TCP connect timeout after " + timeout + "ms" });
    });

    socket.on("error", (err) => {
      resolve({ ok: false, error: err.message });
    });
  });

  return NextResponse.json({
    host,
    port,
    region: process.env.VERCEL_REGION ?? "unknown",
    ...result,
  });
}
