/**
 * One-time migration: exports lib/menu.ts array to data/menu.json.
 * Run: npx tsx scripts/generate-menu-json.ts
 * (Keep this file — useful for re-seeding.)
 */
import { menu } from "../lib/menu";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

const outPath = path.join(process.cwd(), "data", "menu.json");
mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(menu, null, 2), "utf8");
console.log(`✓ Wrote ${menu.length} items to data/menu.json`);
