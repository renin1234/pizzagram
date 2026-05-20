/**
 * Минимальный клиент PayKeeper.
 *
 * Документация — https://paykeeper.ru/wiki/index.php
 * Аккаунт настраивается в личном кабинете: личный поддомен (https://<merchant>.server.paykeeper.ru),
 * пользователь+пароль для HTTP Basic, секретный ключ для подписи уведомлений.
 *
 * Поток:
 *   1. GET /info/settings/token/  — получаем CSRF-токен (один на сессию)
 *   2. POST /change/invoice/preview/ — создаём счёт, получаем invoice_id
 *   3. Открываем клиенту https://<merchant>.server.paykeeper.ru/bill/<invoice_id>/
 *   4. После оплаты PayKeeper шлёт POST-уведомление на наш webhook
 *      с подписью md5(id + sum + clientid + orderid + SECRET) и ждёт ответ OK<md5(id + SECRET)>.
 */

import crypto from "crypto";

export type PayKeeperConfig = {
  baseUrl: string;
  user: string;
  password: string;
  secret: string;
};

export type InvoiceInput = {
  /** Сумма в рублях, без копеек или с двумя знаками. */
  sum: number;
  /** Имя клиента — отображается в кабинете PayKeeper. */
  clientName: string;
  /** Внутренний номер заказа. */
  orderId: string;
  /** Описание услуги (что покупает клиент). */
  serviceName: string;
  /** Телефон клиента в формате +79998887766. */
  clientPhone?: string;
  /** Email клиента — пригодится для отправки чека. */
  clientEmail?: string;
};

export type InvoiceResult = {
  invoiceId: string;
  paymentUrl: string;
};

export type WebhookPayload = {
  id: string;
  sum: string;
  clientid: string;
  orderid: string;
  key: string;
};

export function getConfig(): PayKeeperConfig | null {
  const baseUrl = process.env.PAYKEEPER_BASE_URL;
  const user = process.env.PAYKEEPER_USER;
  const password = process.env.PAYKEEPER_PASSWORD;
  const secret = process.env.PAYKEEPER_SECRET;
  if (!baseUrl || !user || !password || !secret) return null;
  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    user,
    password,
    secret,
  };
}

function basicAuthHeader(cfg: PayKeeperConfig): string {
  return "Basic " + Buffer.from(`${cfg.user}:${cfg.password}`).toString("base64");
}

async function fetchToken(cfg: PayKeeperConfig): Promise<string> {
  const res = await fetch(`${cfg.baseUrl}/info/settings/token/`, {
    headers: { Authorization: basicAuthHeader(cfg) },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`PayKeeper: не удалось получить токен (${res.status})`);
  }
  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("PayKeeper: пустой токен в ответе");
  return data.token;
}

export async function createInvoice(
  cfg: PayKeeperConfig,
  input: InvoiceInput,
): Promise<InvoiceResult> {
  const token = await fetchToken(cfg);

  const form = new URLSearchParams();
  form.set("sum", input.sum.toFixed(2));
  form.set("clientid", input.clientName);
  form.set("orderid", input.orderId);
  form.set("service_name", input.serviceName);
  if (input.clientPhone) form.set("client_phone", input.clientPhone);
  if (input.clientEmail) form.set("client_email", input.clientEmail);
  form.set("token", token);

  const res = await fetch(`${cfg.baseUrl}/change/invoice/preview/`, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(cfg),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayKeeper: создание счёта (${res.status}) ${body}`);
  }
  const data = (await res.json()) as { invoice_id?: string };
  if (!data.invoice_id) throw new Error("PayKeeper: invoice_id отсутствует в ответе");

  return {
    invoiceId: data.invoice_id,
    paymentUrl: `${cfg.baseUrl}/bill/${data.invoice_id}/`,
  };
}

/**
 * PayKeeper подписывает уведомления как md5(id + sum + clientid + orderid + SECRET).
 * Возвращаем true, если подпись валидна.
 */
export function verifyWebhook(cfg: PayKeeperConfig, p: WebhookPayload): boolean {
  const expected = crypto
    .createHash("md5")
    .update(`${p.id}${p.sum}${p.clientid}${p.orderid}${cfg.secret}`)
    .digest("hex");
  return expected.toLowerCase() === (p.key || "").toLowerCase();
}

/**
 * Ответ, который ждёт PayKeeper: OK<md5(id + SECRET)>.
 */
export function buildWebhookAck(cfg: PayKeeperConfig, invoiceId: string): string {
  const hash = crypto
    .createHash("md5")
    .update(`${invoiceId}${cfg.secret}`)
    .digest("hex");
  return `OK${hash}`;
}
