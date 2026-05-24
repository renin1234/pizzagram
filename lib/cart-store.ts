"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Extra } from "./extras";

export type CartLine = {
  id: string;            // composite id, e.g. "pizza-margherita::32 см" or "...::бекон,курица"
  itemId: string;        // menu item id
  name: string;
  sizeLabel: string;
  price: number;         // базовая цена пиццы без добавок
  qty: number;
  image: string;
  extras: Extra[];       // выбранные добавки (пустой массив если нет)
};

type State = {
  lines: CartLine[];
  drawerOpen: boolean;
  pulse: number;          // increments on add to trigger cart icon shake
};

type Actions = {
  add: (input: Omit<CartLine, "qty" | "id" | "extras"> & { qty?: number; extras?: Extra[] }) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  totalCount: () => number;
  totalPrice: () => number;
};

export const useCart = create<State & Actions>()(
  persist(
    (set, get) => ({
      lines: [],
      drawerOpen: false,
      pulse: 0,

      add: ({ itemId, name, sizeLabel, price, image, qty = 1, extras = [] }) => {
        const extrasKey = extras.length > 0
          ? "::" + [...extras].sort((a, b) => a.id.localeCompare(b.id)).map(e => e.id).join(",")
          : "";
        const lineId = `${itemId}::${sizeLabel}${extrasKey}`;
        const prev = get().lines;
        const exists = prev.some((l) => l.id === lineId);
        const lines = exists
          ? prev.map((l) => l.id === lineId ? { ...l, qty: l.qty + qty } : l)
          : [...prev, { id: lineId, itemId, name, sizeLabel, price, image, qty, extras }];
        set({ lines, pulse: get().pulse + 1 });
      },

      remove: (id) =>
        // pulse++ — чтобы иконка корзины в шапке «дёргалась» и при удалении тоже.
        set({
          lines: get().lines.filter((l) => l.id !== id),
          pulse: get().pulse + 1,
        }),

      setQty: (id, qty) => {
        if (qty <= 0) {
          set({ lines: get().lines.filter((l) => l.id !== id) });
          return;
        }
        set({
          lines: get().lines.map((l) => (l.id === id ? { ...l, qty } : l)),
        });
      },

      clear: () => set({ lines: [] }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      toggleDrawer: () => set({ drawerOpen: !get().drawerOpen }),

      totalCount: () => get().lines.reduce((s, l) => s + l.qty, 0),
      totalPrice: () => get().lines.reduce((s, l) => {
        const extrasTotal = (l.extras ?? []).reduce((acc, e) => acc + e.price, 0);
        return s + (l.price + extrasTotal) * l.qty;
      }, 0),
    }),
    {
      name: "pizzagram-cart-v1",
      partialize: (s) => ({ lines: s.lines }),
    },
  ),
);
