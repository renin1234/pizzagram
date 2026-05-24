import { fetchPayment, getConfig } from "@/lib/yookassa";
import { buildOrderMessage, sendToTelegram, type OrderForMessage } from "@/lib/telegram";
import { promises as fs } from "fs";
import path from "path";

/**
 * URL, который надо указать в ЛК ЮКассы → HTTP-уведомления:
 *   https://<ваш_домен>/api/payment-webhook
 *
 * ЮКасса шлёт JSON (POST). Верификация: не доверяем телу вебхука —
 * перезапрашиваем платёж напрямую у ЮКассы по paymentId.
 * Ожидаемый ответ: 200 OK (тело не важно).
 */
export async function POST(req: Request) {
  const cfg = getConfig();
  if (!cfg) return new Response("YooKassa не настроена", { status: 500 });

  let body: { event?: string; object?: { id?: string } };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  if (body.event !== "payment.succeeded") {
    return new Response("OK", { status: 200 });
  }

  const paymentId = body.object?.id;
  if (!paymentId) return new Response("No payment id", { status: 400 });

  let payment: Awaited<ReturnType<typeof fetchPayment>>;
  try {
    payment = await fetchPayment(cfg, paymentId);
  } catch (err) {
    console.error("YooKassa fetchPayment failed:", err);
    return new Response("RETRY", { status: 500 });
  }

  if (payment.status !== "succeeded") return new Response("OK", { status: 200 });

  const orderId = payment.metadata?.orderId;
  let order: OrderForMessage | null = null;
  if (orderId) {
    try {
      const file = path.join(process.cwd(), ".pending-orders", `${orderId}.json`);
      order = JSON.parse(await fs.readFile(file, "utf8")) as OrderForMessage;
      await fs.unlink(file).catch(() => {});
    } catch (err) {
      console.error("Pending order не найден:", orderId, err);
    }
  }

  const message = order
    ? buildOrderMessage({ ...order, paid: true })
    : `✅ *Оплачен заказ* ${orderId ?? paymentId}\n(детали заказа не найдены на сервере)`;

  try {
    await sendToTelegram(message);
  } catch (err) {
    console.error("Telegram send failed:", err);
    return new Response("RETRY", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
