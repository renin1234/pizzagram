/**
 * Отправляет SMS с кодом через smsaero.ru.
 * В режиме разработки (SMSAERO_EMAIL не задан) — выводит код в консоль.
 *
 * Переменные окружения:
 *   SMSAERO_EMAIL    — email аккаунта на smsaero.ru
 *   SMSAERO_API_KEY  — API-ключ из личного кабинета smsaero.ru
 *   SMSAERO_SIGN     — имя отправителя (необязательно; по умолчанию "SMS Aero",
 *                      пока собственное имя не прошло модерацию у оператора)
 */
export async function sendSms(phone: string, code: string): Promise<void> {
  const email = process.env.SMSAERO_EMAIL;
  const apiKey = process.env.SMSAERO_API_KEY;

  if (!email || !apiKey) {
    console.log(`[SMS DEV] Код для ${phone}: ${code}`);
    return;
  }

  // Basic Auth: base64(email:apiKey)
  const auth = Buffer.from(`${email}:${apiKey}`).toString("base64");

  // "SMS Aero" — имя отправителя SMSAero по умолчанию, не требует модерации.
  // Поменяйте SMSAERO_SIGN в .env.local, когда собственное имя будет одобрено оператором.
  const sign = process.env.SMSAERO_SIGN ?? "SMS Aero";

  const params = new URLSearchParams({
    number: phone,
    text: `Ваш код Pizzagram: ${code}`,
    sign,
    channel: "DIRECT",
  });

  const res = await fetch(
    `https://gate.smsaero.ru/v2/sms/send?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SmsAero HTTP ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as { success?: boolean; message?: string };
  if (data.success === false) {
    throw new Error(`SmsAero: ${data.message ?? "unknown error"}`);
  }
}
