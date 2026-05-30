/**
 * Минимальный клиент ЮКассы.
 * Документация: https://yookassa.ru/developers/api
 *
 * Поток:
 *   1. POST /v3/payments — создаём платёж, получаем confirmation_url
 *   2. Редиректим клиента на confirmation_url
 *   3. ЮКасса шлёт POST-уведомление на /api/payment-webhook
 *   4. Верифицируем, запрашивая платёж обратно GET /v3/payments/{id}
 */

import crypto from "crypto";

export type YooKassaConfig = {
  shopId: string;
  secretKey: string;
};

export type ReceiptItem = {
  description: string;
  quantity: string;
  amount: { value: string; currency: "RUB" };
  vat_code: number;
  payment_subject: "commodity" | "service";
  payment_mode: "full_payment";
};

export type CreatePaymentInput = {
  amountRub: number;
  orderId: string;
  description: string;
  returnUrl: string;
  customerPhone: string;
  receiptItems: ReceiptItem[];
};

export function getConfig(): YooKassaConfig | null {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) return null;
  return { shopId, secretKey };
}

function auth(cfg: YooKassaConfig): string {
  return "Basic " + Buffer.from(`${cfg.shopId}:${cfg.secretKey}`).toString("base64");
}

export async function createPayment(
  cfg: YooKassaConfig,
  input: CreatePaymentInput,
): Promise<{ paymentId: string; confirmationUrl: string }> {
  const res = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      Authorization: auth(cfg),
      "Content-Type": "application/json",
      "Idempotence-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      amount: { value: input.amountRub.toFixed(2), currency: "RUB" },
      confirmation: { type: "redirect", return_url: input.returnUrl },
      description: input.description,
      metadata: { orderId: input.orderId },
      receipt: {
        customer: { phone: input.customerPhone },
        items: input.receiptItems,
      },
      capture: true,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`YooKassa createPayment ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  if (!data.confirmation?.confirmation_url) {
    throw new Error("YooKassa: нет confirmation_url в ответе");
  }
  return { paymentId: data.id, confirmationUrl: data.confirmation.confirmation_url };
}

export async function fetchPayment(
  cfg: YooKassaConfig,
  paymentId: string,
): Promise<{ id: string; status: string; amount: { value: string; currency: string }; metadata?: Record<string, string> }> {
  const res = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    headers: { Authorization: auth(cfg) },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`YooKassa fetchPayment ${res.status}`);
  return res.json();
}
