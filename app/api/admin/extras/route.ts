import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-session";
import { readExtras, addExtra } from "@/lib/extras-data";
import type { Extra } from "@/lib/extras";

export async function GET(req: Request) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await readExtras());
}

export async function POST(req: Request) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { type?: string; item?: Partial<Extra> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const { type, item } = body;
  if (type !== "extras" && type !== "sauces") {
    return NextResponse.json({ error: "type must be 'extras' or 'sauces'" }, { status: 400 });
  }
  if (!item?.id || !item?.name || typeof item?.price !== "number") {
    return NextResponse.json({ error: "id, name, price required" }, { status: 400 });
  }

  try {
    await addExtra(type, item as Extra);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ошибка" },
      { status: 409 }
    );
  }
}
