import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-session";
import { updateExtra, deleteExtra } from "@/lib/extras-data";
import type { Extra } from "@/lib/extras";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { type?: string; patch?: Partial<Extra> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const { type, patch } = body;
  if (type !== "extras" && type !== "sauces") {
    return NextResponse.json({ error: "type must be 'extras' or 'sauces'" }, { status: 400 });
  }

  const { id } = await params;
  try {
    const updated = await updateExtra(type, id, patch ?? {});
    return NextResponse.json({ ok: true, item: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ошибка" },
      { status: 404 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const { type } = body;
  if (type !== "extras" && type !== "sauces") {
    return NextResponse.json({ error: "type must be 'extras' or 'sauces'" }, { status: 400 });
  }

  const { id } = await params;
  try {
    await deleteExtra(type, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ошибка" },
      { status: 404 }
    );
  }
}
