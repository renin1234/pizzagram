/**
 * ONE-TIME script — kept for documentation/re-seeding from scratch.
 * data/menu.json is the authoritative source; do NOT re-run unless re-seeding.
 */
import menuData from "../data/menu.json";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

const outPath = path.join(process.cwd(), "data", "menu.json");
mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(menuData, null, 2), "utf8");
console.log(`✓ Wrote ${(menuData as unknown[]).length} items to data/menu.json`);
