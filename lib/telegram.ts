/**
 * Отправка форматированного сообщения о заказе в Telegram-чат пиццерии.
 * Используется из /api/order (для оплат при получении) и из /api/payment-webhook
 * (после успешной онлайн-оплаты PayKeeper).
 */

export type OrderLine = {
  name: string;
  sizeLabel: string;
  qty: number;
  price: number;
  extras?: { name: string; price: number }[];
};

export type OrderForMessage = {
  name: string;
  phone: string;
  address: string;
  method: "delivery" | "pickup";
  comment?: string;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  total: number;
  /** "online" — уже оплачен, "card_courier" — картой курьеру, "cash" — наличными. */
  payment: "online" | "card_courier" | "cash";
  /** Стоимость доставки, ₽ (0 — бесплатно или самовывоз). */
  deliveryPrice?: number;
  /** Внутренний номер заказа. */
  orderId?: string;
  /** Установить true, если деньги уже на счету пиццерии. */
  paid?: boolean;
};

function rub(n: number) {
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}

function esc(s: string): string {
  return s.replace(/[*_`[\]()]/g, "\\$&");
}

export function buildOrderMessage(o: OrderForMessage): string {
  const items = o.lines.map((l) => {
    const base = `• ${esc(l.name)} (${esc(l.sizeLabel)}) × ${l.qty} — ${rub(l.price * l.qty)}`;
    if (l.extras && l.extras.length > 0) {
      const extrasList = l.extras.map(e => esc(e.name)).join(", ");
      const extrasTotal = l.extras.reduce((s, e) => s + e.price, 0) * l.qty;
      return `${base}\n  ↳ \\+ ${extrasList} \\(${rub(extrasTotal)}\\)`;
    }
    return base;
  }).join("\n");
  const methodLabel = o.method === "delivery" ? "Доставка" : "Самовывоз";
  const paymentLabel =
    o.payment === "online"
      ? o.paid
        ? "Онлайн · ✅ оплачено"
        : "Онлайн · ⏳ ждём оплату"
      : o.payment === "card_courier"
      ? "Картой курьеру"
      : "Наличными";

  const header = o.paid
    ? "✅ *Заказ оплачен — Pizzagram*"
    : "🍕 *Новый заказ Pizzagram*";

  const lines: string[] = [
    header,
    "",
    o.orderId ? `*Номер:* ${esc(o.orderId)}` : null,
    `*Имя:* ${esc(o.name)}`,
    `*Телефон:* ${esc(o.phone)}`,
    `*Адрес:* ${esc(o.address)}`,
    "",
    `*Состав заказа:*\n${items}`,
    "",
    `*Товары:* ${rub(o.subtotal)}`,
    o.method === "delivery"
      ? `*Доставка:* ${
          o.deliveryPrice && o.deliveryPrice > 0 ? rub(o.deliveryPrice) : "бесплатно"
        }`
      : null,
    `*Итого:* ${rub(o.total)}`,
    `*Получение:* ${methodLabel}`,
    `*Оплата:* ${paymentLabel}`,
  ].filter(Boolean) as string[];

  if (o.comment && o.comment.trim()) {
    lines.push(`*Комментарий:* ${esc(o.comment.trim())}`);
  }
  return lines.join("\n");
}

/**
 * Отправляет сообщение в Telegram-чат. Если ENV не настроены — пишет в server console.
 * Возвращает true, если сообщение реально ушло в Telegram.
 */
export async function sendToTelegram(message: string): Promise<{ sent: boolean; warning?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("\n=== [PIZZAGRAM · Telegram env not configured] ===");
    console.log(message);
    console.log("=================================================\n");
    return {
      sent: false,
      warning:
        "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы. Сообщение выведено в server console.",
    };
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API ${res.status}: ${body}`);
  }
  return { sent: true };
}
