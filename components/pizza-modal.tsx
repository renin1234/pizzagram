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

  // Сброс состояния при смене товара
  useEffect(() => {
    setSizeIdx(0);
    setSelectedExtraIds(new Set());
    setAdded(false);
  }, [item?.id]);

  // Scroll lock + Escape
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
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 500);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={item.name}
          className="relative w-full max-w-2xl bg-cream border-2 border-ink shadow-[12px_12px_0_var(--ink)] pointer-events-auto max-h-[92vh] overflow-y-auto"
        >
          {/* Крестик */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center border-2 border-ink bg-cream hover:bg-crimson hover:text-cream transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid sm:grid-cols-2">
            {/* Фото */}
            <div
              className="relative aspect-square bg-white overflow-hidden"
              style={{ ["--imgScale" as string]: item.imgScale ?? 1.4 }}
            >
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover card-img"
                priority
              />
            </div>

            {/* Детали */}
            <div className="p-5 sm:p-6 flex flex-col gap-4">
              {/* Название + badge */}
              <div>
                {item.badge && (
                  <span className="inline-block font-display uppercase text-[11px] tracking-widest text-crimson mb-1">
                    {item.badge}
                  </span>
                )}
                <h2 className="font-display text-3xl sm:text-4xl uppercase leading-tight">
                  {item.name}
                </h2>
                <p className="quote text-[14px] text-ink/70 mt-2 leading-snug">
                  {item.ingredients}
                </p>
              </div>

              {/* Размер */}
              {item.sizes.length > 1 && (
                <div>
                  <div className="font-display uppercase tracking-widest text-[11px] text-smoke mb-2">
                    Размер
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {item.sizes.map((s, i) => (
                      <button
                        key={s.label}
                        type="button"
                        onClick={() => setSizeIdx(i)}
                        className={cn(
                          "font-display uppercase tracking-wider text-[13px] px-3 py-2 min-h-[40px] border-2 border-ink transition-colors",
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
                  <div className="font-display uppercase tracking-widest text-[11px] text-smoke mb-2">
                    Добавить ингредиент
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {EXTRAS.map(e => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => toggleExtra(e.id)}
                        className={cn(
                          "text-[11px] font-display uppercase tracking-wider px-2 py-1.5 border-2 border-ink transition-colors",
                          selectedExtraIds.has(e.id)
                            ? "bg-ink text-cream"
                            : "bg-cream-deep hover:bg-ink hover:text-cream"
                        )}
                      >
                        {e.name} +{e.price}₽
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Цена + кнопка */}
              <div className="mt-auto pt-3 border-t-2 border-ink">
                <div className="mb-3">
                  <div className="font-display text-4xl leading-none">
                    {formatRub(displayPrice)}
                  </div>
                  {extrasSum > 0 && (
                    <div className="text-[11px] text-smoke mt-1">
                      {formatRub(size.price)} + добавки {formatRub(extrasSum)}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={added}
                  className={cn(
                    "btn-primary w-full justify-center text-base transition-all",
                    added && "!bg-ink opacity-80"
                  )}
                >
                  {added ? "Добавлено ✓" : `В корзину — ${formatRub(displayPrice)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
