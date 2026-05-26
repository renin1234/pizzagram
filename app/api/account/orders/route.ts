import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { sql } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    const orders = await sql`
      SELECT id, lines, total, address, payment, created_at
      FROM orders
      WHERE user_id = ${session.sub}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("Orders fetch error:", err);
    return NextResponse.json({ error: "Ошибка получения заказов" }, { status: 500 });
  }
}
