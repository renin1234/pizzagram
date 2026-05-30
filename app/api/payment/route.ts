import { NextResponse } from "next/server";
import crypto from "crypto";
import { createPayment, getConfig, type ReceiptItem } from "@/lib/yookassa";
import { buildOrderMessage, sendToTelegram, type OrderForMessage, type OrderLine } from "@/lib/telegram";
import { getSessionFromRequest } from "@/lib/session";
import { sql } from "@/lib/db";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { verifyAndPriceLines } from "@/lib/order-pricing";

export async function POST(req: Request) {
  const rl = rateLimit(`payment:${getIP(req)}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов на оплату. Попробуйте позже." },
      { status: 429 },
    );
  }

  // Fail fast: if YooKassa is not configured, no point parsing the request.
  const cfg = getConfig();
  if (!cfg) {
    return NextResponse.json(
      { error: "Онлайн-оплата временно недоступна. Выберите оплату при получении." },
      { status: 503 },
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

  const phone = toE164(payload.phone);
  if (phone.replace(/\D/g, "").length < 11) {
    return NextResponse.json(
      { error: "Укажите полный номер телефона (например, +7 900 123-45-67)" },
      { status: 400 },
    );
  }

  // Recompute all prices server-side — never trust client-submitted prices.
  const pricing = await verifyAndPriceLines(
    payload.lines as Parameters<typeof verifyAndPriceLines>[0],
    (payload as { deliveryPrice?: unknown }).deliveryPrice,
  );
  if (!pricing.ok) {
    return NextResponse.json({ error: pricing.error }, { status: 400 });
  }

  const orderId = `PG-${Date.now().toString(36)}-${crypto.randomBytes(2).toString("hex")}`.toUpperCase();
  const session = await getSessionFromRequest(req);
  const userId = session?.sub ?? null;
  const enrichedPayload: OrderForMessage & { userId?: string | null } = {
    ...payload,
    lines: pricing.lines,
    subtotal: pricing.itemsTotal,
    deliveryPrice: pricing.deliveryPrice,
    total: pricing.total,
    orderId,
    userId,
  };

  try {
    await sql`
      INSERT INTO pending_orders (id, data)
      VALUES (${orderId}, ${JSON.stringify(enrichedPayload)})
    `;

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

    const payment = await createPayment(cfg, {
      amountRub: pricing.total,
      orderId,
      description: `Заказ Pizzagram ${orderId}`,
      returnUrl: `${siteUrl}/payment-success?order=${orderId}`,
      customerPhone: toE164(enrichedPayload.phone),
      receiptItems: buildReceiptItems(pricing.lines, pricing.deliveryPrice, pricing.total),
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

function buildReceiptItems(lines: OrderLine[], deliveryPrice: number, total: number): ReceiptItem[] {
  const raw = [
    ...lines.map((l) => ({
      description: `${l.name} (${l.sizeLabel})`,
      rawTotal: l.price * l.qty,
      subject: "commodity" as const,
    })),
    ...(deliveryPrice > 0
      ? [{ description: "Доставка", rawTotal: deliveryPrice, subject: "service" as const }]
      : []),
  ];

  const gross = raw.reduce((s, i) => s + i.rawTotal, 0);
  const target = total;

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
