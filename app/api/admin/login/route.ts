import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { signAdminSession, buildAdminCookie } from "@/lib/admin-session";

function constantTimeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function POST(req: Request) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD ?? "";
  if (!expected) {
    return NextResponse.json({ error: "ADMIN_PASSWORD не задан" }, { status: 500 });
  }

  if (!constantTimeEqual(expected, body.password ?? "")) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  const token = await signAdminSession();
  return NextResponse.json(
    { ok: true },
    { headers: { "Set-Cookie": buildAdminCookie(token) } }
  );
}
