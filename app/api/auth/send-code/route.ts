import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendSms } from "@/lib/sms";
import { rateLimit, getIP } from "@/lib/rate-limit";

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) {
    return "+7" + digits.slice(1);
  }
  if (digits.length === 10) {
    return "+7" + digits;
  }
  return null;
}

export async function POST(req: Request) {
  const ipCheck = rateLimit(`sms:ip:${getIP(req)}`, 5, 10 * 60 * 1000);
  if (!ipCheck.ok) {
    return NextResponse.json(
      { error: `Слишком много запросов. Повторите через ${ipCheck.retryAfterSec} сек.` },
      { status: 429 },
    );
  }

  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "");

  if (phone) {
    const phoneCheck = rateLimit(`sms:phone:${phone}`, 3, 10 * 60 * 1000);
    if (!phoneCheck.ok) {
      return NextResponse.json(
        { error: `SMS уже отправлена. Повторите через ${phoneCheck.retryAfterSec} сек.` },
        { status: 429 },
      );
    }
  }
  if (!phone) {
    return NextResponse.json({ error: "Неверный формат телефона" }, { status: 400 });
  }

  await sql`DELETE FROM otp_codes WHERE phone = ${phone} AND used = FALSE`;

  const code = String(Math.floor(1000 + Math.random() * 9000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  try {
    await sql`INSERT INTO otp_codes (phone, code, expires_at) VALUES (${phone}, ${code}, ${expiresAt})`;
  } catch (err) {
    console.error("otp_codes insert error:", err);
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }

  try {
    await sendSms(phone, code);
  } catch (err) {
    console.error("SMS send error:", err);
    return NextResponse.json({ error: "Не удалось отправить SMS" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
