import { buildWebhookAck, getConfig, verifyWebhook, type WebhookPayload } from "@/lib/paykeeper";
import { buildOrderMessage, sendToTelegram, type OrderForMessage } from "@/lib/telegram";
import { promises as fs } from "fs";
import path from "path";

/**
 * URL, который надо указать в кабинете PayKeeper в разделе
 * «Получение информации о платежах» → «Уведомления».
 * Метод: POST, формат: x-www-form-urlencoded.
 * Ожидаемый ответ: OK<md5(id + secret)>.
 */
export async function POST(req: Request) {
  const cfg = getConfig();
  if (!cfg) {
    return new Response("PayKeeper не настроен", { status: 500 });
  }

  const body = await req.text();
  const params = new URLSearchParams(body);
  const payload: WebhookPayload = {
    id: params.get("id") || "",
    sum: params.get("sum") || "",
    clientid: params.get("clientid") || "",
    orderid: params.get("orderid") || "",
    key: params.get("key") || "",
  };

  if (!verifyWebhook(cfg, payload)) {
    console.warn("PayKeeper webhook: подпись не сошлась", payload);
    return new Response("BAD SIGNATURE", { status: 400 });
  }

  // Подтягиваем заказ из .pending-orders/<orderId>.json.
  let order: OrderForMessage | null = null;
  try {
    const file = path.join(process.cwd(), ".pending-orders", `${payload.orderid}.json`);
    const raw = await fs.readFile(file, "utf8");
    order = JSON.parse(raw) as OrderForMessage;
    // Не падаем, если не получится удалить — это не критично.
    await fs.unlink(file).catch(() => {});
  } catch (err) {
    console.error("Pending order не найден:", payload.orderid, err);
  }

  const message = order
    ? buildOrderMessage({ ...order, paid: true })
    : `✅ *Оплачен заказ* ${payload.orderid}\nСумма: ${payload.sum} ₽\nКлиент: ${payload.clientid}\n(детали заказа не найдены на сервере)`;

  try {
    await sendToTelegram(message);
  } catch (err) {
    // PayKeeper повторит уведомление, если мы не ответим ему OK.
    console.error("Telegram send failed in webhook:", err);
    return new Response("RETRY", { status: 500 });
  }

  return new Response(buildWebhookAck(cfg, payload.id), {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
