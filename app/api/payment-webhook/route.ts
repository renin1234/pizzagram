import { fetchPayment, getConfig } from "@/lib/yookassa";
import { buildOrderMessage, sendToTelegram, type OrderForMessage } from "@/lib/telegram";
import { sql } from "@/lib/db";
import { getIP } from "@/lib/rate-limit";

const YOOKASSA_CIDRS = [
  "185.71.76.0/27",
  "185.71.77.0/27",
  "77.75.153.0/25",
  "77.75.154.128/25",
  "77.75.156.11/32",
  "77.75.156.35/32",
];

function ipToInt(ip: string): number {
  return ip.split(".").reduce((acc, oct) => (acc << 8) | parseInt(oct, 10), 0) >>> 0;
}

function ipInCidr(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split("/");
  const mask = bits === "32" ? 0xffffffff : (~(0xffffffff >>> parseInt(bits))) >>> 0;
  return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
}

function isYookassaIp(ip: string): boolean {
  return YOOKASSA_CIDRS.some((cidr) => ipInCidr(ip, cidr));
}

export async function POST(req: Request) {
  // IP check in all environments — localhost is exempt only for explicit dev testing.
  const ip = getIP(req);
  if (ip !== "127.0.0.1" && ip !== "::1" && !isYookassaIp(ip)) {
    console.warn(`payment-webhook: отклонён запрос с IP ${ip}`);
    return new Response("Forbidden", { status: 403 });
  }

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
  let order: (OrderForMessage & { userId?: string | null }) | null = null;

  if (orderId) {
    try {
      const rows = await sql`SELECT data FROM pending_orders WHERE id = ${orderId}`;
      if (rows.length > 0) {
        order = rows[0].data as OrderForMessage & { userId?: string | null };

        // Verify the paid amount matches what was stored server-side.
        const paidRub = parseFloat(payment.amount.value);
        const expectedRub = (order as { total?: number }).total ?? 0;
        if (Math.abs(paidRub - expectedRub) > 0.01) {
          console.error(
            `Webhook amount mismatch for ${orderId}: paid ${paidRub}, expected ${expectedRub}`,
          );
          return new Response("Amount mismatch", { status: 400 });
        }

        // Save order regardless of whether user is authenticated (user_id may be null).
        sql`
          INSERT INTO orders (user_id, lines, total, address, payment)
          VALUES (
            ${order.userId ?? null},
            ${JSON.stringify(order.lines)},
            ${expectedRub},
            ${order.address ?? null},
            'online'
          )
        `.catch((err) => console.error("DB webhook order insert:", err));

        await sql`DELETE FROM pending_orders WHERE id = ${orderId}`;
      }
    } catch (err) {
      console.error("Pending order lookup failed:", orderId, err);
    }
  }

  const message = order
    ? buildOrderMessage({ ...order, paid: true })
    : `✅ *Оплачен заказ* ${orderId ?? paymentId}\n(детали заказа не найдены)`;

  try {
    await sendToTelegram(message);
  } catch (err) {
    console.error("Telegram send failed:", err);
    return new Response("RETRY", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
