"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  id: string;            // composite id, e.g. "pizza-margherita::32 см"
  itemId: string;        // menu item id
  name: string;
  sizeLabel: string;
  price: number;
  qty: number;
  image: string;
};

type State = {
  lines: CartLine[];
  drawerOpen: boolean;
  pulse: number;          // increments on add to trigger cart icon shake
};

type Actions = {
  add: (input: Omit<CartLine, "qty" | "id"> & { qty?: number }) => void;
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

      add: ({ itemId, name, sizeLabel, price, image, qty = 1 }) => {
        const lineId = `${itemId}::${sizeLabel}`;
        const lines = get().lines.slice();
        const existing = lines.find((l) => l.id === lineId);
        if (existing) {
          existing.qty += qty;
        } else {
          lines.push({ id: lineId, itemId, name, sizeLabel, price, image, qty });
        }
        set({ lines, pulse: get().pulse + 1 });
      },

      remove: (id) =>
        set({ lines: get().lines.filter((l) => l.id !== id) }),

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
      totalPrice: () => get().lines.reduce((s, l) => s + l.price * l.qty, 0),
    }),
    {
      name: "pizzagram-cart-v1",
      partialize: (s) => ({ lines: s.lines }),
    },
  ),
);
