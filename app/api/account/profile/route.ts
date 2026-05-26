import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { sql } from "@/lib/db";

export async function PATCH(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  let body: { name?: string; address?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : null;
  const address = typeof body.address === "string" ? body.address.trim().slice(0, 300) : null;

  if (name === null && address === null) {
    return NextResponse.json({ error: "Нечего обновлять" }, { status: 400 });
  }

  try {
    let rows;
    if (name !== null && address !== null) {
      rows = await sql`
        UPDATE users SET name = ${name || null}, address = ${address}
        WHERE id = ${session.sub}
        RETURNING id, phone, name, address
      `;
    } else if (name !== null) {
      rows = await sql`
        UPDATE users SET name = ${name || null}
        WHERE id = ${session.sub}
        RETURNING id, phone, name, address
      `;
    } else {
      rows = await sql`
        UPDATE users SET address = ${address}
        WHERE id = ${session.sub}
        RETURNING id, phone, name, address
      `;
    }

    if (!rows.length) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user: rows[0] });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }
}
