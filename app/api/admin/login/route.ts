import { NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "crypto";
import { signAdminSession, buildAdminCookie } from "@/lib/admin-session";

function constantTimeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
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
