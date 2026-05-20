import { NextResponse } from "next/server";
import { buildOrderMessage, sendToTelegram, type OrderForMessage } from "@/lib/telegram";

export async function POST(req: Request) {
  let payload: OrderForMessage;
  try {
    payload = (await req.json()) as OrderForMessage;
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  if (!payload.name || !payload.phone || !Array.isArray(payload.lines) || payload.lines.length === 0) {
    return NextResponse.json({ error: "Не хватает данных" }, { status: 400 });
  }

  // /api/order используется только для оплат "при получении" (card_courier / cash).
  // Онлайн-оплаты идут через /api/payment, а в Telegram уходят из webhook'а после подтверждения.
  if (payload.payment === "online") {
    return NextResponse.json(
      { error: "Для онлайн-оплаты используйте /api/payment" },
      { status: 400 },
    );
  }

  const message = buildOrderMessage({ ...payload, paid: false });
  try {
    const result = await sendToTelegram(message);
    return NextResponse.json({ ok: true, warning: result.warning });
  } catch (err) {
    console.error("Telegram send failed:", err);
    return NextResponse.json({ error: "Не удалось отправить заказ" }, { status: 502 });
  }
}
