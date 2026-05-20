import { NextResponse } from "next/server";
import crypto from "crypto";
import { createInvoice, getConfig } from "@/lib/paykeeper";
import { buildOrderMessage, sendToTelegram, type OrderForMessage } from "@/lib/telegram";
import { promises as fs } from "fs";
import path from "path";

/**
 * Создаёт счёт в PayKeeper и возвращает ссылку, на которую надо отправить клиента.
 * Параллельно сохраняет «черновик» заказа в .pending-orders/<orderId>.json,
 * чтобы webhook после оплаты мог достать состав заказа и отправить в Telegram.
 */
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
  if (payload.payment !== "online") {
    return NextResponse.json({ error: "payment должен быть 'online'" }, { status: 400 });
  }

  const cfg = getConfig();

  // Генерим короткий orderId, который PayKeeper вернёт в webhook.
  const orderId = `PG-${Date.now().toString(36)}-${crypto.randomBytes(2).toString("hex")}`.toUpperCase();
  const enrichedPayload: OrderForMessage = { ...payload, orderId };

  if (!cfg) {
    // Dev-режим: PayKeeper не настроен. Шлём предварительное сообщение в Telegram
    // и отдаём фронту флаг simulated, чтобы он показал заглушку.
    const message = buildOrderMessage({
      ...enrichedPayload,
      paid: false,
      comment: (enrichedPayload.comment ? enrichedPayload.comment + "\n" : "") +
        "⚠️ PayKeeper не настроен — оплата не выполнена, заказ только зарегистрирован.",
    });
    await sendToTelegram(message).catch((e) => console.error(e));
    return NextResponse.json(
      {
        ok: true,
        simulated: true,
        orderId,
        warning:
          "PAYKEEPER_* переменные не заданы — счёт не создан. Заполните .env.local. См. .env.example.",
      },
      { status: 200 },
    );
  }

  try {
    await savePendingOrder(orderId, enrichedPayload);

    const invoice = await createInvoice(cfg, {
      sum: enrichedPayload.total,
      clientName: enrichedPayload.name,
      orderId,
      serviceName: `Заказ Pizzagram ${orderId}`,
      clientPhone: enrichedPayload.phone,
    });

    return NextResponse.json({
      ok: true,
      orderId,
      invoiceId: invoice.invoiceId,
      paymentUrl: invoice.paymentUrl,
    });
  } catch (err) {
    console.error("PayKeeper invoice failed:", err);
    return NextResponse.json(
      { error: "Не удалось создать счёт оплаты. Попробуйте ещё раз или выберите оплату при получении." },
      { status: 502 },
    );
  }
}

async function savePendingOrder(orderId: string, payload: OrderForMessage): Promise<void> {
  const dir = path.join(process.cwd(), ".pending-orders");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${orderId}.json`), JSON.stringify(payload, null, 2), "utf8");
}
