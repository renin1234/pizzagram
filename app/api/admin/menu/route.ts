import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-session";
import { readMenu, addMenuItem } from "@/lib/menu-data";
import type { MenuItem } from "@/lib/menu";

export async function GET(req: Request) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ items: await readMenu() });
}

export async function POST(req: Request) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<MenuItem>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  if (!body.id || !body.name || !body.category || !body.sizes?.length) {
    return NextResponse.json(
      { error: "Обязательные поля: id, name, category, sizes" },
      { status: 400 }
    );
  }

  try {
    await addMenuItem(body as MenuItem);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ошибка записи" },
      { status: 409 }
    );
  }
}
