/**
 * Server-side order price verification.
 * Looks up each line by itemId (or name as fallback) against the canonical menu,
 * and each extra by id (or name as fallback) against the canonical extras list.
 * Returns server-authoritative prices — client-submitted prices are ignored.
 */
import { readMenu } from "@/lib/menu-data";
import { readExtras } from "@/lib/extras-data";
import type { OrderLine } from "@/lib/telegram";
import { DELIVERY_ZONES } from "@/lib/delivery-zones";

const MAX_DELIVERY_PRICE = Math.max(...DELIVERY_ZONES.map((z) => z.price), 0);

export type PricingResult =
  | { ok: true; lines: OrderLine[]; itemsTotal: number; deliveryPrice: number; total: number }
  | { ok: false; error: string };

type RawLine = {
  itemId?: string;
  name?: string;
  sizeLabel?: string;
  qty?: unknown;
  extras?: { id?: string; name?: string }[];
};

export async function verifyAndPriceLines(
  rawLines: RawLine[],
  clientDeliveryPrice: unknown,
): Promise<PricingResult> {
  const [allMenu, { extras: allExtras, sauces: allSauces }] = await Promise.all([
    readMenu(),
    readExtras(),
  ]);
  const allExtrasFlat = [...allExtras, ...allSauces];

  const lines: OrderLine[] = [];
  for (const raw of rawLines) {
    const qty = raw.qty;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      return { ok: false, error: "Недопустимое количество позиции" };
    }

    const menuItem = raw.itemId
      ? allMenu.find((m) => m.id === raw.itemId && !m.hidden)
      : allMenu.find((m) => m.name.toLowerCase() === raw.name?.toLowerCase() && !m.hidden);

    if (!menuItem) {
      return { ok: false, error: `Позиция не найдена: ${raw.name ?? raw.itemId}` };
    }

    const sizeEntry = menuItem.sizes.find((s) => s.label === raw.sizeLabel);
    if (!sizeEntry) {
      return { ok: false, error: `Размер не найден: ${raw.sizeLabel}` };
    }

    const verifiedExtras: { name: string; price: number }[] = [];
    for (const e of raw.extras ?? []) {
      const found = e.id
        ? allExtrasFlat.find((x) => x.id === e.id)
        : allExtrasFlat.find((x) => x.name.toLowerCase() === e.name?.toLowerCase());
      if (!found) {
        return { ok: false, error: `Добавка не найдена: ${e.name}` };
      }
      verifiedExtras.push({ name: found.name, price: found.price });
    }

    const price = sizeEntry.price + verifiedExtras.reduce((s, e) => s + e.price, 0);
    lines.push({
      name: menuItem.name,
      sizeLabel: sizeEntry.label,
      qty,
      price,
      ...(verifiedExtras.length ? { extras: verifiedExtras } : {}),
    });
  }

  const itemsTotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const dp =
    typeof clientDeliveryPrice === "number" &&
    Number.isFinite(clientDeliveryPrice) &&
    clientDeliveryPrice >= 0
      ? Math.min(Math.round(clientDeliveryPrice), MAX_DELIVERY_PRICE)
      : 0;

  return { ok: true, lines, itemsTotal, deliveryPrice: dp, total: itemsTotal + dp };
}
