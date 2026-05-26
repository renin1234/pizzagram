import { NextResponse } from "next/server";
import crypto from "crypto";
import { createPayment, getConfig, type ReceiptItem } from "@/lib/yookassa";
import { buildOrderMessage, sendToTelegram, type OrderForMessage } from "@/lib/telegram";
import { getSessionFromRequest } from "@/lib/session";
import { sql } from "@/lib/db";
import { rateLimit, getIP } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const rl = rateLimit(`payment:${getIP(req)}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов на оплату. Попробуйте позже." },
      { status: 429 },
    );
  }

  let payload: OrderForMessage;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  if (!payload.name || !payload.phone || !Array.isArray(payload.lines) || payload.lines.length === 0) {
    return NextResponse.json({ error: "Не хватает данных" }, { status: 400 });
  }
  if (payload.payment !== "online") {
    return NextResponse.json({ error: "payment должен быть 'online'" }, { status: 400 });
  }

  const cfg = getConfig();
  const orderId = `PG-${Date.now().toString(36)}-${crypto.randomBytes(2).toString("hex")}`.toUpperCase();
  const session = await getSessionFromRequest(req);
  const userId = session?.sub ?? null;
  const enrichedPayload: OrderForMessage & { userId?: string | null } = { ...payload, orderId, userId };

  if (!cfg) {
    const message = buildOrderMessage({
      ...enrichedPayload,
      paid: false,
      comment:
        (enrichedPayload.comment ? enrichedPayload.comment + "\n" : "") +
        "⚠️ YooKassa не настроена — оплата не выполнена, заказ только зарегистрирован.",
    });
    await sendToTelegram(message).catch(console.error);
    return NextResponse.json({
      ok: true,
      simulated: true,
      orderId,
      warning: "YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY не заданы.",
    });
  }

  try {
    await sql`
      INSERT INTO pending_orders (id, data)
      VALUES (${orderId}, ${JSON.stringify(enrichedPayload)})
    `;

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

    const payment = await createPayment(cfg, {
      amountRub: enrichedPayload.total,
      orderId,
      description: `Заказ Pizzagram ${orderId}`,
      returnUrl: `${siteUrl}/payment-success?order=${orderId}`,
      customerPhone: toE164(enrichedPayload.phone),
      receiptItems: buildReceiptItems(enrichedPayload),
    });

    return NextResponse.json({ ok: true, orderId, paymentUrl: payment.confirmationUrl });
  } catch (err) {
    console.error("YooKassa payment failed:", err);
    return NextResponse.json(
      { error: "Не удалось создать платёж. Попробуйте ещё раз или выберите оплату при получении." },
      { status: 502 },
    );
  }
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const norm = digits.length === 11 && digits[0] === "8" ? "7" + digits.slice(1) : digits;
  return "+" + norm;
}

function buildReceiptItems(payload: OrderForMessage): ReceiptItem[] {
  const raw = [
    ...payload.lines.map((l) => ({
      description: `${l.name} (${l.sizeLabel})`,
      rawTotal: l.price * l.qty,
      subject: "commodity" as const,
    })),
    ...(payload.deliveryPrice && payload.deliveryPrice > 0
      ? [{ description: "Доставка", rawTotal: payload.deliveryPrice, subject: "service" as const }]
      : []),
  ];

  const gross = raw.reduce((s, i) => s + i.rawTotal, 0);
  const target = payload.total;

  let allocated = 0;
  return raw.map((item, idx) => {
    const isLast = idx === raw.length - 1;
    const scaled = isLast
      ? Math.round((target - allocated) * 100) / 100
      : Math.round((item.rawTotal / gross) * target * 100) / 100;
    if (!isLast) allocated += scaled;

    return {
      description: item.description,
      quantity: "1.00",
      amount: { value: scaled.toFixed(2), currency: "RUB" },
      vat_code: 1,
      payment_subject: item.subject,
      payment_mode: "full_payment",
    };
  });
}
