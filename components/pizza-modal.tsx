"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { type MenuItem } from "@/lib/menu";
import { EXTRAS } from "@/lib/extras";
import type { Extra } from "@/lib/extras";
import { useCart } from "@/lib/cart-store";
import { cn, formatRub } from "@/lib/utils";

type Props = {
  item: MenuItem | null;
  onClose: () => void;
};

export default function PizzaModal({ item, onClose }: Props) {
  const add = useCart((s) => s.add);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [selectedExtraIds, setSelectedExtraIds] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setSizeIdx(0);
    setSelectedExtraIds(new Set());
    setAdded(false);
  }, [item?.id]);

  useEffect(() => {
    if (!item) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [item, onClose]);

  const toggleExtra = useCallback((id: string) => {
    setSelectedExtraIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  if (!item) return null;

  const size = item.sizes[sizeIdx];
  const selectedExtras: Extra[] = EXTRAS.filter(e => selectedExtraIds.has(e.id));
  const extrasSum = selectedExtras.reduce((s, e) => s + e.price, 0);
  const displayPrice = size.price + extrasSum;

  const handleAdd = () => {
    add({
      itemId: item.id,
      name: item.name,
      sizeLabel: size.label,
      price: size.price,
      image: item.image,
      extras: selectedExtras,
    });
    setAdded(true);
    setTimeout(() => { setAdded(false); onClose(); }, 500);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Позиционирование */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">

        {/* Сам модал */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={item.name}
          className="relative w-full max-w-3xl bg-cream border-2 border-ink shadow-[16px_16px_0_var(--ink)] flex flex-col sm:flex-row max-h-[92vh]"
        >

          {/* ── Крестик ── */}
          <button
            onClick={onClose}
            className="absolute -top-4 -right-4 z-20 w-10 h-10 rounded-full border-2 border-ink bg-cream flex items-center justify-center hover:bg-crimson hover:text-cream transition-colors shadow-[3px_3px_0_var(--ink)]"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>

          {/* ── Левая колонка: фото ── */}
          <div className="sm:w-[300px] lg:w-[360px] shrink-0 bg-white flex items-center justify-center">
            <div
              className="relative w-full aspect-square"
              style={{ ["--imgScale" as string]: item.imgScale ?? 1.4 }}
            >
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(min-width: 640px) 360px, 100vw"
                className="object-cover card-img"
                priority
              />
            </div>
          </div>

          {/* ── Правая колонка: детали + прокрутка ── */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

            {/* Скролл-область */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">

              {/* Название + badge */}
              <div>
                {item.badge && (
                  <span className="inline-block font-display uppercase text-[10px] tracking-widest text-crimson border border-crimson px-2 py-0.5 mb-2">
                    {item.badge}
                  </span>
                )}
                <h2 className="font-display text-3xl sm:text-4xl uppercase leading-tight">
                  {item.name}
                </h2>
                <p className="text-[13px] text-ink/60 mt-2 leading-snug">
                  {item.ingredients}
                </p>
              </div>

              {/* Размер — только если несколько */}
              {item.sizes.length > 1 && (
                <div>
                  <p className="font-display uppercase tracking-widest text-[10px] text-smoke mb-2">Размер</p>
                  <div className="flex flex-wrap gap-2">
                    {item.sizes.map((s, i) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setSizeIdx(i)}
                        className={cn(
                          "font-display uppercase text-[12px] tracking-wider px-4 py-2 rounded-full border-2 border-ink transition-colors",
                          i === sizeIdx ? "bg-ink text-cream" : "bg-cream hover:bg-cream-deep"
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Добавки — только для пиццы */}
              {item.category === "pizza" && (
                <div>
                  <p className="font-display uppercase tracking-widest text-[10px] text-smoke mb-3">
                    Добавить по вкусу
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {EXTRAS.map(e => {
                      const active = selectedExtraIds.has(e.id);
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => toggleExtra(e.id)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1 p-2 border-2 border-ink text-center transition-colors",
                            active ? "bg-ink text-cream" : "bg-white hover:bg-cream-deep"
                          )}
                        >
                          <span className={cn(
                            "font-display uppercase text-[10px] sm:text-[11px] tracking-wide leading-tight",
                            active ? "text-cream" : "text-ink"
                          )}>
                            {e.name}
                          </span>
                          <span className={cn(
                            "font-display text-[13px] sm:text-[15px] leading-none mt-0.5",
                            active ? "text-crimson" : "text-crimson"
                          )}>
                            +{e.price}₽
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ── Липкий футер: цена + кнопка ── */}
            <div className="shrink-0 border-t-2 border-ink bg-cream p-4 sm:p-5">
              {extrasSum > 0 && (
                <p className="text-[11px] text-smoke mb-1.5">
                  {formatRub(size.price)} + добавки {formatRub(extrasSum)}
                </p>
              )}
              <button
                type="button"
                onClick={handleAdd}
                disabled={added}
                className={cn(
                  "w-full font-display uppercase tracking-wider text-base py-4 border-2 border-ink transition-all",
                  added
                    ? "bg-ink text-cream opacity-70"
                    : "bg-crimson text-cream hover:bg-ink"
                )}
              >
                {added ? "Добавлено ✓" : `В корзину — ${formatRub(displayPrice)}`}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
