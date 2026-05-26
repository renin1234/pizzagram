# Pizza Product Modal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Клик по фото или названию пиццы открывает центрированный модал с крупным фото, описанием, чипами добавок, выбором размера и кнопкой «В корзину».

**Architecture:** Новый компонент `components/pizza-modal.tsx`. Состояние `activeItem: MenuItem | null` поднято в `MenuSection` — один инстанс модала на всю секцию. `PizzaCard` получает проп `onOpenModal`; кнопка `+` по-прежнему добавляет в корзину быстро (без модала). Инлайн-экспансия добавок на карточке полностью удаляется — она переезжает в модал.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 3, Zustand (cart), lucide-react, `lib/extras.ts`, `lib/menu.ts`

---

## Карта файлов

| Файл | Действие | Что меняется |
|------|----------|--------------|
| `components/pizza-modal.tsx` | **Create** | Полный модал: backdrop, dialog, фото, детали, extras, add to cart |
| `components/menu-section.tsx` | Modify | Добавить `activeItem` state в `MenuSection`; передать `onOpenModal` в `PizzaCard`; удалить инлайн-extras из `PizzaCard`; рендерить `<PizzaModal>` |

---

## Task 1 — Создать `components/pizza-modal.tsx`

**Files:**
- Create: `components/pizza-modal.tsx`

- [ ] **Шаг 1.1 — Создать файл с полным кодом компонента**

  ```tsx
  // components/pizza-modal.tsx
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none"
        >
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
  ```

- [ ] **Шаг 1.2 — TypeScript check**

  ```
  npx tsc --noEmit
  ```
  Ожидаем: **0 ошибок** (модал ещё не используется, импорты должны разрешиться).

---

## Task 2 — Обновить `menu-section.tsx`

**Files:**
- Modify: `components/menu-section.tsx`

### 2A — Добавить import PizzaModal и activeItem state в MenuSection

- [ ] **Шаг 2A.1 — Добавить импорт PizzaModal**

  В начало файла, после существующих импортов:
  ```tsx
  import PizzaModal from "@/components/pizza-modal";
  ```

- [ ] **Шаг 2A.2 — Добавить `activeItem` state в `MenuSection`**

  В теле функции `MenuSection`, после строки `const openAssistant = ...`:
  ```tsx
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  ```

- [ ] **Шаг 2A.3 — Передать `onOpenModal` в `PizzaCard`**

  Строку рендера карточки поменять:
  ```tsx
  // было:
  <PizzaCard key={`${active}-${item.id}`} item={item} index={i} />
  // стало:
  <PizzaCard key={`${active}-${item.id}`} item={item} index={i} onOpenModal={setActiveItem} />
  ```

- [ ] **Шаг 2A.4 — Добавить `<PizzaModal>` в JSX `MenuSection`**

  Прямо перед закрывающим `</section>`:
  ```tsx
  <PizzaModal item={activeItem} onClose={() => setActiveItem(null)} />
  ```

### 2B — Обновить `PizzaCard`: убрать инлайн-extras, добавить проп + клики

- [ ] **Шаг 2B.1 — Добавить проп `onOpenModal` в сигнатуру `PizzaCard`**

  ```tsx
  // было:
  function PizzaCard({ item, index }: { item: MenuItem; index: number }) {
  // стало:
  function PizzaCard({ item, index, onOpenModal }: {
    item: MenuItem;
    index: number;
    onOpenModal: (item: MenuItem) => void;
  }) {
  ```

- [ ] **Шаг 2B.2 — Удалить состояние extras из PizzaCard**

  Удалить эти строки из тела `PizzaCard` (они переехали в модал):
  ```tsx
  // УДАЛИТЬ:
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [selectedExtraIds, setSelectedExtraIds] = useState<Set<string>>(new Set());

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
  ```

- [ ] **Шаг 2B.3 — Обновить `handleAdd` (убрать extras)**

  ```tsx
  // было:
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
  // стало:
  const handleAdd = () => {
    add({
      itemId: item.id,
      name: item.name,
      sizeLabel: size.label,
      price: size.price,
      image: item.image,
      extras: [],
    });
    setPop(true);
    setTimeout(() => setPop(false), 400);
  };
  ```

- [ ] **Шаг 2B.4 — Цена в карточке: вернуть обратно `size.price`**

  После удаления `displayPrice` в карточке ссылаемся прямо на `size.price`:
  ```tsx
  // было:
  <div className="font-display text-[28px] leading-none mt-1">
    {formatRub(displayPrice)}
  </div>
  // стало:
  <div className="font-display text-[28px] leading-none mt-1">
    {formatRub(size.price)}
  </div>
  ```

- [ ] **Шаг 2B.5 — Сделать фото кликабельным → открывает модал**

  ```tsx
  // было:
  <div
    className="relative aspect-square overflow-hidden bg-white"
    style={{ ["--imgScale" as string]: item.imgScale ?? 1.4 }}
  >
  // стало:
  <div
    className="relative aspect-square overflow-hidden bg-white cursor-pointer"
    style={{ ["--imgScale" as string]: item.imgScale ?? 1.4 }}
    onClick={() => onOpenModal(item)}
    role="button"
    aria-label={`Подробнее о ${item.name}`}
  >
  ```

- [ ] **Шаг 2B.6 — Сделать название кликабельным → открывает модал**

  ```tsx
  // было:
  <h3 className="font-display text-2xl sm:text-[28px] leading-tight uppercase">
    {item.name}
  </h3>
  // стало:
  <h3
    className="font-display text-2xl sm:text-[28px] leading-tight uppercase cursor-pointer hover:text-crimson transition-colors"
    onClick={() => onOpenModal(item)}
  >
    {item.name}
  </h3>
  ```

- [ ] **Шаг 2B.7 — Удалить блок инлайн-extras из JSX карточки**

  Удалить весь блок (между `{/* Sizes */}` и `<div className="flex items-end ...`):
  ```tsx
  // УДАЛИТЬ ВЕСЬ ЭТОТ БЛОК:
  {/* Extras */}
  {item.category === "pizza" && (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setExtrasOpen(!extrasOpen)}
        ...
      >
      ...
      </button>
      {extrasOpen && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          ...
        </div>
      )}
    </div>
  )}
  ```

- [ ] **Шаг 2B.8 — Убрать неиспользуемые импорты из menu-section.tsx**

  Если после удаления extras `Extra` тип и `EXTRAS` больше не нужны в `menu-section.tsx` — удалить их импорт:
  ```tsx
  // УДАЛИТЬ эти две строки:
  import { EXTRAS } from "@/lib/extras";
  import type { Extra } from "@/lib/extras";
  ```

### 2C — Финальная проверка и коммит

- [ ] **Шаг 2C.1 — TypeScript check**

  ```
  npx tsc --noEmit
  ```
  Ожидаем: **0 ошибок**.

- [ ] **Шаг 2C.2 — Визуальная проверка**

  1. Открыть `http://localhost:3000`
  2. Нажать на фото пиццы → модал открылся с фото + деталями + добавками
  3. Нажать на название пиццы → тот же модал
  4. Выбрать добавку «Бекон» → цена внизу обновилась (base + 80₽)
  5. Нажать «В корзину» → кнопка меняется на «Добавлено ✓», модал закрывается, иконка корзины дёргается
  6. В корзине: позиция с добавкой отображается правильно
  7. Нажать кнопку `+` на карточке → пицца добавляется без добавок (быстрое добавление)
  8. Нажать Escape / клик по backdrop → модал закрывается
  9. Прокрутить страницу с открытым моделью → страница под ним не скроллится

- [ ] **Шаг 2C.3 — Коммит**

  ```
  git add components/pizza-modal.tsx components/menu-section.tsx
  git commit -m "feat: pizza product modal with extras picker

  - Add PizzaModal component (backdrop, image, extras chips, size selector, price, add to cart)
  - Click pizza photo or title to open modal
  - + button on card still adds quickly without extras
  - Remove inline extras expansion from PizzaCard
  - Escape key and backdrop click close modal
  - Body scroll lock while modal is open"
  ```

---

## Самопроверка плана

- [x] Spec coverage: модал создан (Task 1), карточка обновлена (Task 2) — все требования закрыты
- [x] Нет плейсхолдеров: весь код полный
- [x] Типы согласованы: `MenuItem` из `@/lib/menu`, `Extra` из `@/lib/extras`, `useCart.add` принимает `extras: Extra[]`
- [x] `onOpenModal: (item: MenuItem) => void` передаётся как `setActiveItem` — типы совпадают
- [x] `handleAdd` в PizzaCard передаёт `extras: []` — совместимо с обновлённым `CartLine.extras`
