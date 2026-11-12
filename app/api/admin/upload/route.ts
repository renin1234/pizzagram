import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAdminSessionFromRequest } from "@/lib/admin-session";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Uploads a menu photo to Vercel Blob (public) and returns its URL.
// Admin-only, same cookie guard as the other /api/admin routes.
export async function POST(req: Request) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Хранилище не настроено: нет BLOB_READ_WRITE_TOKEN" },
      { status: 500 }
    );
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать файл" }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Разрешены только изображения: JPEG, PNG, WebP, GIF" },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Файл слишком большой (максимум 8 МБ)" },
      { status: 413 }
    );
  }

  const ext = (file.type.split("/")[1] ?? "jpg").replace("jpeg", "jpg");
  const name = `menu-photos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    const blob = await put(name, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ошибка загрузки" },
      { status: 500 }
    );
  }
}
