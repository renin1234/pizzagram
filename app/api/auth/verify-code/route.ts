import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { signSession, buildSessionCookie } from "@/lib/session";
import { rateLimit, getIP } from "@/lib/rate-limit";

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) {
    return "+7" + digits.slice(1);
  }
  if (digits.length === 10) return "+7" + digits;
  return null;
}

export async function POST(req: Request) {
  const ipCheck = await rateLimit(`otp:ip:${getIP(req)}`, 10, 10 * 60 * 1000);
  if (!ipCheck.ok) {
    return NextResponse.json(
      { error: `Слишком много попыток. Подождите ${ipCheck.retryAfterSec} сек.` },
      { status: 429 },
    );
  }

  let body: { phone?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "");
  const code = (body.code ?? "").trim();

  if (!phone || !code) {
    return NextResponse.json({ error: "Не хватает данных" }, { status: 400 });
  }

  const phoneCheck = await rateLimit(`otp:phone:${phone}`, 5, 15 * 60 * 1000);
  if (!phoneCheck.ok) {
    return NextResponse.json(
      { error: `Слишком много неверных попыток. Запросите новый код через ${phoneCheck.retryAfterSec} сек.` },
      { status: 429 },
    );
  }

  const otpRows = await sql`
    SELECT id FROM otp_codes
    WHERE phone = ${phone} AND code = ${code} AND used = FALSE AND expires_at > NOW()
    LIMIT 1
  `;

  if (!otpRows.length) {
    return NextResponse.json({ error: "Неверный или устаревший код" }, { status: 400 });
  }

  await sql`UPDATE otp_codes SET used = TRUE WHERE id = ${otpRows[0].id}`;

  const existingUsers = await sql`
    SELECT id, phone, name, address FROM users WHERE phone = ${phone}
  `;

  let userId: string;
  let user: { id: string; phone: string; name: string | null; address: string | null };

  if (existingUsers.length > 0) {
    userId = existingUsers[0].id as string;
    user = existingUsers[0] as typeof user;
  } else {
    const newUsers = await sql`
      INSERT INTO users (phone) VALUES (${phone}) RETURNING id, phone, name, address
    `;
    if (!newUsers.length) {
      return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
    }
    userId = newUsers[0].id as string;
    user = newUsers[0] as typeof user;
  }

  const token = await signSession(userId, phone);

  return new Response(JSON.stringify({ ok: true, user }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": buildSessionCookie(token),
    },
  });
}
