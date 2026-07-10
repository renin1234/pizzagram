/**
 * Server-side only. Reads and writes extras/sauces via Vercel Blob in production,
 * falls back to bundled data/extras.json in dev (when BLOB_READ_WRITE_TOKEN is absent).
 */
import { put, list } from "@vercel/blob";
import { hasJsonStoreDatabase, readJsonValue, writeJsonValue } from "@/lib/json-store";
import type { Extra } from "./extras";
import extrasFallback from "../data/extras.json";

type ExtrasFile = { extras: Extra[]; sauces: Extra[] };

const BLOB_PATH = "data/extras.json";
const STORE_KEY = "extras";

export async function readExtras(): Promise<ExtrasFile> {
  const stored = await readJsonValue<ExtrasFile>(STORE_KEY);
  if (stored) return stored;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return extrasFallback as ExtrasFile;
  }
  try {
    const { blobs } = await list({ prefix: BLOB_PATH, limit: 1 });
    if (!blobs.length) return extrasFallback as ExtrasFile;
    const res = await fetch(blobs[0].url, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    if (!res.ok) return extrasFallback as ExtrasFile;
    return res.json();
  } catch {
    return extrasFallback as ExtrasFile;
  }
}

export async function writeExtras(data: ExtrasFile): Promise<void> {
  if (hasJsonStoreDatabase()) {
    await writeJsonValue(STORE_KEY, data);
    return;
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Нет доступного хранилища добавок: DATABASE_URL и BLOB_READ_WRITE_TOKEN не настроены");
  }

  await put(BLOB_PATH, JSON.stringify(data, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function addExtra(type: "extras" | "sauces", item: Extra): Promise<void> {
  const data = await readExtras();
  if (data[type].find((e) => e.id === item.id)) {
    throw new Error(`Item with id "${item.id}" already exists`);
  }
  data[type].push(item);
  await writeExtras(data);
}

export async function updateExtra(type: "extras" | "sauces", id: string, patch: Partial<Extra>): Promise<Extra> {
  const data = await readExtras();
  const idx = data[type].findIndex((e) => e.id === id);
  if (idx === -1) throw new Error(`Extra "${id}" not found in ${type}`);
  const updated = { ...data[type][idx], ...patch, id: data[type][idx].id };
  data[type][idx] = updated;
  await writeExtras(data);
  return updated;
}

export async function deleteExtra(type: "extras" | "sauces", id: string): Promise<void> {
  const data = await readExtras();
  const filtered = data[type].filter((e) => e.id !== id);
  if (filtered.length === data[type].length) throw new Error(`Extra "${id}" not found in ${type}`);
  data[type] = filtered;
  await writeExtras(data);
}
