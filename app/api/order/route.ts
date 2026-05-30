import { NextResponse } from "next/server";
import { buildOrderMessage, sendToTelegram, type OrderForMessage } from "@/lib/telegram";
import { getSessionFromRequest } from "@/lib/session";
import { sql } from "@/lib/db";
import { rateLimit, getIP } from "@/lib/rate-limit";
import { verifyAndPriceLines } from "@/lib/order-pricing";

export async function POST(req: Request) {
  const rl = await rateLimit(`order:${getIP(req)}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Слишком много заказов. Попробуйте позже." },
      { status: 429 },
    );
  }

  let payload: OrderForMessage;
  try {
    payload = (await req.json()) as OrderForMessage;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  if (!payload.name || !payload.phone || !Array.isArray(payload.lines) || payload.lines.length === 0) {
    return NextResponse.json({ error: "Не хватает данных" }, { status: 400 });
  }

  if (
    String(payload.name).length > 120 ||
    String(payload.phone).length > 20 ||
    String(payload.address ?? "").length > 300 ||
    String(payload.comment ?? "").length > 1000 ||
    payload.lines.length > 30
  ) {
    return NextResponse.json({ error: "Данные превышают допустимый размер" }, { status: 400 });
  }

  if (payload.payment === "online") {
    return NextResponse.json(
      { error: "Для онлайн-оплаты используйте /api/payment" },
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

  const verifiedPayload: OrderForMessage = {
    ...payload,
    lines: pricing.lines,
    subtotal: pricing.itemsTotal,
    deliveryPrice: pricing.deliveryPrice,
    total: pricing.total,
  };

  const session = await getSessionFromRequest(req);
  sql`
    INSERT INTO orders (user_id, lines, total, address, payment)
    VALUES (${session?.sub ?? null}, ${JSON.stringify(pricing.lines)}, ${pricing.total}, ${payload.address ?? null}, ${payload.payment})
  `.catch((err) => console.error("DB order insert error:", err));

  const message = buildOrderMessage({ ...verifiedPayload, paid: false });
  try {
    const result = await sendToTelegram(message);
    return NextResponse.json({ ok: true, total: pricing.total, warning: result.warning });
  } catch (err) {
    console.error("Telegram send failed:", err);
    return NextResponse.json({ error: "Не удалось отправить заказ" }, { status: 502 });
  }
}
