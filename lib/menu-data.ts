/**
 * Server-side only. Reads and writes data/menu.json.
 * Never import this in client components (uses Node.js fs).
 */
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import type { MenuItem } from "./menu";

const MENU_PATH = path.join(process.cwd(), "data", "menu.json");

export function readMenu(): MenuItem[] {
  return JSON.parse(readFileSync(MENU_PATH, "utf8")) as MenuItem[];
}

export function writeMenu(items: MenuItem[]): void {
  writeFileSync(MENU_PATH, JSON.stringify(items, null, 2), "utf8");
}

export function getMenuItem(id: string): MenuItem | undefined {
  return readMenu().find((item) => item.id === id);
}

export function addMenuItem(item: MenuItem): void {
  const items = readMenu();
  if (items.find((i) => i.id === item.id)) {
    throw new Error(`Item with id "${item.id}" already exists`);
  }
  writeMenu([...items, item]);
}

export function updateMenuItem(id: string, patch: Partial<MenuItem>): MenuItem {
  const items = readMenu();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error(`Item "${id}" not found`);
  // Strip id from patch — callers must not rename items
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _discarded, ...safePatch } = patch as Partial<MenuItem> & { id?: string };
  const updated = { ...items[idx], ...safePatch } as MenuItem;
  items[idx] = updated;
  writeMenu(items);
  return updated;
}

export function deleteMenuItem(id: string): void {
  const items = readMenu();
  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length === items.length) throw new Error(`Item "${id}" not found`);
  writeMenu(filtered);
}
