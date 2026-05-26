import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-session";
import { sql } from "@/lib/db";

export async function GET(req: Request) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await sql`
      SELECT
        o.id, o.user_id, o.lines, o.total, o.address, o.payment, o.status, o.created_at,
        u.phone AS user_phone, u.name AS user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 100
    `;

    const orders = rows.map((o) => ({
      ...o,
      users: o.user_phone ? { phone: o.user_phone, name: o.user_name } : null,
    }));

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("admin orders fetch error:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
