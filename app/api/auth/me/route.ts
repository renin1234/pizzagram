import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { sql } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const rows = await sql`
    SELECT id, phone, name, address FROM users WHERE id = ${session.sub}
  `;

  if (!rows.length) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: rows[0] });
}
