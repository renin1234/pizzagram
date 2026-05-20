"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { menu, categoryLabels, categoryOrder, type Category, type MenuItem } from "@/lib/menu";
import { useCart } from "@/lib/cart-store";
import { cn, formatRub } from "@/lib/utils";

export default function MenuSection() {
  const [active, setActive] = useState<Category>("pizza");
  const items = useMemo(() => menu.filter((i) => i.category === active), [active]);

  return (
    <section id="menu" className="relative border-b-2 border-ink">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-16 lg:py-24">
        {/* Section head */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 lg:mb-14">
          <div>
            <div className="eyebrow text-crimson">02 — Меню</div>
            <h2 className="display text-[clamp(48px,8vw,120px)] mt-3">
              Что у нас <span className="quote font-normal italic text-ink/80">из&nbsp;печи</span>
            </h2>
            <p className="quote text-lg text-ink/80 mt-4 max-w-xl">
              23 пиццы по фиксированной цене. Лепим тесто руками каждое утро,
              печём 90 секунд при 460°C.
            </p>
          </div>

          {/* Big price callout */}
          <div className="border-2 border-ink bg-cream-deep px-5 py-4 shadow-[6px_6px_0_var(--ink)] self-start lg:self-end">
            <div className="font-display uppercase text-[11px] tracking-widest text-smoke">
              Стартовая цена
            </div>
            <div className="font-display text-5xl leading-none mt-1">
              250 <span className="text-crimson">₽</span>
            </div>
            <div className="font-display uppercase text-[11px] tracking-widest mt-1">
              Маргарита · 32 см
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-b-2 border-ink pb-[1px]">
            {categoryOrder.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={cn(
                  "font-display uppercase tracking-wider text-[15px] sm:text-base px-4 sm:px-5 py-3 border-2 border-ink border-b-0 -mb-[2px] transition-colors",
                  active === c
                    ? "bg-ink text-cream"
                    : "bg-cream hover:bg-cream-deep"
                )}
              >
                {categoryLabels[c]}
              </button>
            ))}
            <div className="ml-auto hidden sm:flex items-center gap-2 text-smoke text-sm pr-1">
              <span className="font-display uppercase tracking-widest text-[11px]">
                {items.length} позиций
              </span>
            </div>
          </div>

          {/* Grid — flex с центровкой: неполный последний ряд стоит
              посередине, по бокам — фон страницы (без тёмных блоков).
              Линии сетки рисуют бордюры самих карточек. */}
          <div className="flex flex-wrap justify-center border-x-2 border-b-2 border-ink">
            {items.map((item) => (
              <PizzaCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PizzaCard({ item }: { item: MenuItem }) {
  const add = useCart((s) => s.add);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [pop, setPop] = useState(false);
  const size = item.sizes[sizeIdx];

  const handleAdd = () => {
    add({
      itemId: item.id,
      name: item.name,
      sizeLabel: size.label,
      price: size.price,
      image: item.image,
    });
    setPop(true);
    setTimeout(() => setPop(false), 400);
  };

  return (
    <article className="group relative bg-cream flex flex-col border border-ink w-1/2 lg:w-1/3 xl:w-1/4">
      {item.badge && <BadgeStamp label={item.badge} />}

      <div
        className="relative aspect-square overflow-hidden bg-white"
        style={{ ["--imgScale" as string]: item.imgScale ?? 1.4 }}
      >
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, 50vw"
          className="object-cover card-img transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="font-display text-2xl sm:text-[28px] leading-tight uppercase">
          {item.name}
        </h3>
        <p className="quote text-[14px] text-ink/75 mt-2 leading-snug line-clamp-2">
          {item.ingredients}
        </p>

        {/* Sizes */}
        {item.sizes.length > 1 && (
          <div className="flex items-center gap-1.5 mt-4">
            {item.sizes.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setSizeIdx(i)}
                className={cn(
                  "text-[12px] font-display uppercase tracking-wider px-2.5 py-1 border-2 border-ink transition-colors",
                  i === sizeIdx
                    ? "bg-ink text-cream"
                    : "bg-cream hover:bg-cream-deep"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end justify-between gap-3 mt-auto pt-4">
          <div>
            <div className="text-[11px] font-display uppercase tracking-widest text-smoke leading-none">
              {item.sizes.length > 1 ? "Цена" : size.label}
            </div>
            <div className="font-display text-[28px] leading-none mt-1">
              {formatRub(size.price)}
            </div>
          </div>

          <button
            onClick={handleAdd}
            aria-label={`Добавить ${item.name}`}
            className={cn(
              "shrink-0 w-11 h-11 rounded-full border-2 border-ink bg-crimson text-cream flex items-center justify-center transition-all hover:bg-ink hover:rotate-90",
              pop && "scale-125"
            )}
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
          </button>
        </div>
      </div>
    </article>
  );
}

function BadgeStamp({ label }: { label: string }) {
  const color = label === "ВЕГ" ? "text-ink" : label === "ОСТРОЕ" ? "text-crimson" : "text-crimson";
  return (
    <div className="absolute top-3 left-3 z-10">
      <div className={cn("stamp text-sm bg-cream/80", color)}>{label}</div>
    </div>
  );
}
