"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Plus, Sparkles } from "lucide-react";
import { menu, categoryLabels, categoryOrder, type Category, type MenuItem } from "@/lib/menu";
import { EXTRAS } from "@/lib/extras";
import type { Extra } from "@/lib/extras";
import { useCart } from "@/lib/cart-store";
import { useAssistant } from "@/lib/assistant-store";
import { cn, formatRub } from "@/lib/utils";
import Reveal, { useReveal } from "@/components/reveal";

export default function MenuSection() {
  const [active, setActive] = useState<Category>("pizza");
  const items = useMemo(() => menu.filter((i) => i.category === active), [active]);
  const openAssistant = useAssistant((s) => s.setOpen);

  return (
    <section id="menu" className="relative border-b-2 border-ink">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-16 lg:py-24">
        {/* Section head */}
        <Reveal>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 lg:mb-14">
          <div>
            <div className="eyebrow text-crimson">02 — Меню</div>
            <h2 className="display text-[clamp(48px,8vw,120px)] mt-3">
              Что у нас <span className="quote font-normal italic text-ink/80">из&nbsp;печи</span>
            </h2>
            <p className="quote text-lg text-ink/80 mt-4 max-w-xl">
              23 пиццы по фиксированной цене. Лепим тесто руками каждое утро,
              печём 3–4 минуты при 460°C.
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
        </Reveal>

        {/* Строка-вход в ИИ-помощника */}
        <Reveal className="mb-10 lg:mb-12">
          <button
            onClick={() => openAssistant(true)}
            className="group w-full flex items-center gap-4 border-2 border-ink bg-ink text-cream px-4 sm:px-6 py-4 sm:py-5 text-left shadow-[6px_6px_0_var(--crimson)] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0_var(--crimson)]"
          >
            <Sparkles className="w-7 h-7 shrink-0 text-crimson" />
            <div className="flex-1 min-w-0">
              <div className="font-display uppercase tracking-wide text-base sm:text-lg leading-tight">
                Не знаете, что выбрать?
              </div>
              <div className="quote text-cream/70 text-[13px] sm:text-sm mt-0.5">
                ИИ-помощник подберёт пиццу под ваш вкус
              </div>
            </div>
            <span className="shrink-0 font-display uppercase text-[12px] sm:text-[13px] tracking-widest bg-crimson text-cream px-3 sm:px-4 py-2 sm:py-2.5 group-hover:bg-cream group-hover:text-ink transition-colors">
              Спросить →
            </span>
          </button>
        </Reveal>

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

          {/* Grid — flex с центровкой: все карточки одного размера,
              неполный последний ряд встаёт по центру. Внешней рамки нет,
              поэтому пустых блоков по бокам не возникает. */}
          <div className="flex flex-wrap justify-center">
            {items.map((item, i) => (
              <PizzaCard key={`${active}-${item.id}`} item={item} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PizzaCard({ item, index }: { item: MenuItem; index: number }) {
  const add = useCart((s) => s.add);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [pop, setPop] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [selectedExtraIds, setSelectedExtraIds] = useState<Set<string>>(new Set());
  const { ref, visible } = useReveal<HTMLElement>();
  const size = item.sizes[sizeIdx];

  const selectedExtras: Extra[] = EXTRAS.filter(e => selectedExtraIds.has(e.id));
  const extrasSum = selectedExtras.reduce((s, e) => s + e.price, 0);
  const displayPrice = size.price + extrasSum;

  const toggleExtra = (id: string) => {
    setSelectedExtraIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    add({
      itemId: item.id,
      name: item.name,
      sizeLabel: size.label,
      price: size.price,
      image: item.image,
      extras: selectedExtras,
    });
    setPop(true);
    setTimeout(() => setPop(false), 400);
  };

  return (
    <article
      ref={ref}
      style={{ transitionDelay: `${Math.min(index * 30, 240)}ms` }}
      className={cn(
        "group relative bg-cream flex flex-col border border-ink w-1/2 lg:w-1/3 xl:w-1/4 reveal",
        visible && "reveal-visible"
      )}
    >
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
                  "text-[12px] font-display uppercase tracking-wider px-2.5 py-1.5 min-h-[36px] border-2 border-ink transition-colors",
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

        {/* Extras */}
        {item.category === "pizza" && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setExtrasOpen(!extrasOpen)}
              className="flex items-center gap-1.5 text-[12px] font-display uppercase tracking-wider text-crimson hover:text-ink transition-colors"
            >
              <Plus className={cn("w-3 h-3 transition-transform duration-200", extrasOpen && "rotate-45")} />
              {extrasOpen ? "Скрыть добавки" : "Добавить ингредиент"}
            </button>
            {extrasOpen && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {EXTRAS.map(e => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleExtra(e.id)}
                    className={cn(
                      "text-[11px] font-display uppercase tracking-wider px-2 py-1.5 border-2 border-ink transition-colors",
                      selectedExtraIds.has(e.id)
                        ? "bg-ink text-cream"
                        : "bg-cream hover:bg-cream-deep"
                    )}
                  >
                    {e.name} +{e.price}₽
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-end justify-between gap-3 mt-auto pt-4">
          <div>
            <div className="text-[11px] font-display uppercase tracking-widest text-smoke leading-none">
              {item.sizes.length > 1 ? "Цена" : size.label}
            </div>
            <div className="font-display text-[28px] leading-none mt-1">
              {formatRub(displayPrice)}
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
