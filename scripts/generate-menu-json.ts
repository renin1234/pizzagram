/**
 * ONE-TIME migration script. Run before updating lib/menu.ts to import from JSON.
 * After data/menu.json exists, do NOT re-run — edits made via admin panel would be lost.
 * Keep this file for documentation/re-seeding from scratch only.
 */
import { menu } from "../lib/menu";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

const outPath = path.join(process.cwd(), "data", "menu.json");
mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(menu, null, 2), "utf8");
console.log(`✓ Wrote ${menu.length} items to data/menu.json`);
