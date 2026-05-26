/**
 * Server-side only. Reads and writes menu via Vercel Blob in production,
 * falls back to bundled data/menu.json in dev (when BLOB_READ_WRITE_TOKEN is absent).
 */
import { put, list } from "@vercel/blob";
import type { MenuItem } from "./menu";
import menuFallback from "../data/menu.json";

const BLOB_PATH = "data/menu.json";

export async function readMenu(): Promise<MenuItem[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return menuFallback as unknown as MenuItem[];
  }
  try {
    const { blobs } = await list({ prefix: BLOB_PATH, limit: 1 });
    if (!blobs.length) return menuFallback as unknown as MenuItem[];
    const res = await fetch(blobs[0].url, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    if (!res.ok) return menuFallback as unknown as MenuItem[];
    return res.json();
  } catch {
    return menuFallback as unknown as MenuItem[];
  }
}

export async function writeMenu(items: MenuItem[]): Promise<void> {
  await put(BLOB_PATH, JSON.stringify(items, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function getMenuItem(id: string): Promise<MenuItem | undefined> {
  return (await readMenu()).find((item) => item.id === id);
}

export async function addMenuItem(item: MenuItem): Promise<void> {
  const items = await readMenu();
  if (items.find((i) => i.id === item.id)) {
    throw new Error(`Item with id "${item.id}" already exists`);
  }
  await writeMenu([...items, item]);
}

export async function updateMenuItem(id: string, patch: Partial<MenuItem>): Promise<MenuItem> {
  const items = await readMenu();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error(`Item "${id}" not found`);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _discarded, ...safePatch } = patch as Partial<MenuItem> & { id?: string };
  const updated = { ...items[idx], ...safePatch } as MenuItem;
  items[idx] = updated;
  await writeMenu(items);
  return updated;
}

export async function deleteMenuItem(id: string): Promise<void> {
  const items = await readMenu();
  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length === items.length) throw new Error(`Item "${id}" not found`);
  await writeMenu(filtered);
}
