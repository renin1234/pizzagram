"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatRub } from "@/lib/utils";

export default function StickyCta() {
  const count = useCart((s) => s.totalCount());
  const total = useCart((s) => s.totalPrice());
  const open = useCart((s) => s.openDrawer);

  if (count === 0) return null;

  return (
    <button
      onClick={open}
      className="lg:hidden fixed left-3 right-3 bottom-3 z-30 bg-crimson text-cream border-2 border-ink shadow-[6px_6px_0_var(--ink)] flex items-center justify-between gap-3 px-4 py-3 font-display uppercase tracking-wider"
    >
      <span className="flex items-center gap-2">
        <ShoppingBag className="w-5 h-5" />
        {count} {countWord(count)} в корзине
      </span>
      <span className="text-lg">{formatRub(total)} →</span>
    </button>
  );
}

function countWord(n: number) {
  const last = n % 10;
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return "позиций";
  if (last === 1) return "позиция";
  if (last >= 2 && last <= 4) return "позиции";
  return "позиций";
}
