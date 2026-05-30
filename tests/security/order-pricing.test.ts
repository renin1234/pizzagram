/**
 * Security regression: server-side price verification.
 *
 * Confirms that verifyAndPriceLines() ignores client-submitted prices and
 * rejects unknown items/sizes/extras with a 400-equivalent error.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { MenuItem } from "@/lib/menu";
import type { Extra } from "@/lib/extras";

// ---------- stable menu / extras fixtures ----------------------------------

const MENU: MenuItem[] = [
  {
    id: "pizza-margherita",
    category: "pizza",
    name: "Маргарита",
    ingredients: "томатный соус, моцарелла",
    sizes: [
      { label: "32 см", price: 250 },
      { label: "40 см", price: 350 },
    ],
    image: "/img/margherita.png",
  },
  {
    id: "pizza-pepperoni",
    category: "pizza",
    name: "Пепперони",
    ingredients: "томатный соус, пепперони, моцарелла",
    sizes: [{ label: "32 см", price: 350 }],
    image: "/img/pepperoni.png",
  },
  {
    id: "pizza-hidden",
    category: "pizza",
    name: "Скрытая",
    ingredients: "секрет",
    sizes: [{ label: "32 см", price: 100 }],
    image: "/img/hidden.png",
    hidden: true,
  },
];

const EXTRAS: Extra[] = [
  { id: "bacon", name: "Бекон", price: 80 },
  { id: "mozzarella", name: "Моцарелла", price: 50 },
];

// ---------- mock Blob-backed loaders ----------------------------------------

vi.mock("@/lib/menu-data", () => ({
  readMenu: vi.fn(),
}));
vi.mock("@/lib/extras-data", () => ({
  readExtras: vi.fn(),
}));

import { readMenu } from "@/lib/menu-data";
import { readExtras } from "@/lib/extras-data";
import { verifyAndPriceLines } from "@/lib/order-pricing";

beforeEach(() => {
  vi.mocked(readMenu).mockResolvedValue(MENU);
  vi.mocked(readExtras).mockResolvedValue({ extras: EXTRAS, sauces: [] });
});

// ---------------------------------------------------------------------------

describe("verifyAndPriceLines — payment tampering protection", () => {
  it("ignores client price and returns server price for a single item", async () => {
    const result = await verifyAndPriceLines(
      [{ itemId: "pizza-margherita", name: "Маргарита", sizeLabel: "32 см", qty: 1, price: 1 }],
      0,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lines[0].price).toBe(250); // server price, not 1
    expect(result.total).toBe(250);
  });

  it("ignores client total when multiple items are ordered", async () => {
    const result = await verifyAndPriceLines(
      [
        { itemId: "pizza-margherita", sizeLabel: "32 см", qty: 2, price: 1 },
        { itemId: "pizza-pepperoni", sizeLabel: "32 см", qty: 1, price: 1 },
      ],
      0,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // 2×250 + 1×350 = 850, NOT 3×1 = 3
    expect(result.total).toBe(850);
  });

  it("adds delivery price to total but caps it at max zone price", async () => {
    const result = await verifyAndPriceLines(
      [{ itemId: "pizza-margherita", sizeLabel: "32 см", qty: 1, price: 1 }],
      149, // valid zone 1 delivery fee
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.deliveryPrice).toBe(149);
    expect(result.total).toBe(250 + 149);
  });

  it("clamps client delivery price to max zone price (no negative manipulation)", async () => {
    const result = await verifyAndPriceLines(
      [{ itemId: "pizza-margherita", sizeLabel: "32 см", qty: 1, price: 1 }],
      99999, // attacker inflates delivery; gets capped
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Max zone price is 349; delivery above that is capped
    expect(result.deliveryPrice).toBeLessThanOrEqual(349);
  });

  it("treats non-numeric delivery price as 0", async () => {
    const result = await verifyAndPriceLines(
      [{ itemId: "pizza-margherita", sizeLabel: "32 см", qty: 1, price: 999 }],
      "free" as unknown as number,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.deliveryPrice).toBe(0);
  });
});

describe("verifyAndPriceLines — extras pricing", () => {
  it("recomputes extra prices server-side", async () => {
    const result = await verifyAndPriceLines(
      [
        {
          itemId: "pizza-margherita",
          sizeLabel: "32 см",
          qty: 1,
          price: 1,
          extras: [{ id: "bacon", name: "Бекон", price: 1 }], // client sends price:1
        },
      ],
      0,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // 250 (pizza) + 80 (bacon server price), NOT 250+1
    expect(result.lines[0].price).toBe(330);
    expect(result.total).toBe(330);
  });

  it("falls back to name-based extra lookup when id is absent", async () => {
    const result = await verifyAndPriceLines(
      [
        {
          itemId: "pizza-margherita",
          sizeLabel: "32 см",
          qty: 1,
          price: 999,
          extras: [{ name: "Бекон", price: 999 }], // no id, client price ignored
        },
      ],
      0,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lines[0].price).toBe(330); // server extra price: 80
  });
});

describe("verifyAndPriceLines — invalid input rejection", () => {
  it("rejects unknown itemId with ok:false", async () => {
    const result = await verifyAndPriceLines(
      [{ itemId: "pizza-nonexistent", sizeLabel: "32 см", qty: 1, price: 1 }],
      0,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/не найдена/i);
  });

  it("rejects unknown size label with ok:false", async () => {
    const result = await verifyAndPriceLines(
      [{ itemId: "pizza-margherita", sizeLabel: "99 см", qty: 1, price: 1 }],
      0,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/размер не найден/i);
  });

  it("rejects hidden menu items", async () => {
    const result = await verifyAndPriceLines(
      [{ itemId: "pizza-hidden", sizeLabel: "32 см", qty: 1, price: 1 }],
      0,
    );

    expect(result.ok).toBe(false);
  });

  it("rejects qty = 0", async () => {
    const result = await verifyAndPriceLines(
      [{ itemId: "pizza-margherita", sizeLabel: "32 см", qty: 0, price: 250 }],
      0,
    );

    expect(result.ok).toBe(false);
  });

  it("rejects fractional qty", async () => {
    const result = await verifyAndPriceLines(
      [{ itemId: "pizza-margherita", sizeLabel: "32 см", qty: 1.5, price: 250 }],
      0,
    );

    expect(result.ok).toBe(false);
  });

  it("rejects qty above 99", async () => {
    const result = await verifyAndPriceLines(
      [{ itemId: "pizza-margherita", sizeLabel: "32 см", qty: 100, price: 250 }],
      0,
    );

    expect(result.ok).toBe(false);
  });

  it("rejects unknown extra id", async () => {
    const result = await verifyAndPriceLines(
      [
        {
          itemId: "pizza-margherita",
          sizeLabel: "32 см",
          qty: 1,
          price: 250,
          extras: [{ id: "gold-dust", name: "Золотая пыль", price: 0 }],
        },
      ],
      0,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/добавка не найдена/i);
  });

  it("falls back to name matching when itemId absent", async () => {
    const result = await verifyAndPriceLines(
      [{ name: "Маргарита", sizeLabel: "32 см", qty: 1, price: 1 }],
      0,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.lines[0].price).toBe(250);
  });
});
