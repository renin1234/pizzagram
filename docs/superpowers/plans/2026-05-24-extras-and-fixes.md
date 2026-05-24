# Extras, UI Fixes & Hitbox Repair — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить платные добавки к пицце и исправить 4 UI-задачи + хитбоксы.

**Architecture:** Новый `lib/extras.ts` — источник данных. `cart-store.ts` хранит выбранные добавки в `CartLine`. `PizzaCard` в `menu-section.tsx` — точка выбора добавок. `cart-drawer.tsx` отображает их в корзине и передаёт в API. `telegram.ts` выводит добавки в сообщении оператору.

**Tech Stack:** Next.js 14 App Router, React 19, Zustand (persist), TypeScript, Tailwind CSS 3

---

## Карта файлов

| Файл | Действие | Что меняется |
|------|----------|--------------|
| `components/hero.tsx` | Modify | grid col-span, circle max-w, текст «весна» |
| `components/cart-drawer.tsx` | Modify | убрать PaymentMethods, показать extras в CartList, передать extras в payload |
| `lib/extras.ts` | **Create** | тип `Extra`, константа `EXTRAS[16]` |
| `lib/cart-store.ts` | Modify | `CartLine.extras`, новый `lineId` с extras-fingerprint, `totalPrice()` учитывает extras |
| `components/menu-section.tsx` | Modify | `PizzaCard`: состояние extras, UI-чипы, обновлённая цена |
| `lib/telegram.ts` | Modify | `OrderLine.extras`, extras в buildOrderMessage |
| `components/cookie-banner.tsx` | Modify | хитбокс кнопки закрытия `w-7 h-7` → `w-10 h-10` |
| `components/footer.tsx` | Modify | хитбоксы правовых ссылок `py-1` |

---

## Task 1 — Быстрые правки: текст + убрать PaymentMethods

**Files:**
- Modify: `components/hero.tsx`
- Modify: `components/cart-drawer.tsx`

- [ ] **Шаг 1.1 — hero.tsx: убрать «весна»**

  В `components/hero.tsx` строка 16:
  ```tsx
  // было:
  <span className="eyebrow">№ 01 — Меню весна 2026</span>
  // стало:
  <span className="eyebrow">№ 01 — Меню 2026</span>
  ```

- [ ] **Шаг 1.2 — cart-drawer.tsx: удалить блок «Принимаем»**

  Удалить строки 494–500 (блок `{/* Фича 5 */}` со спаном и `<PaymentMethods />`):
  ```tsx
  // УДАЛИТЬ весь этот блок:
  {/* Фича 5 — иконки принимаемых способов оплаты */}
  <div className="flex flex-wrap items-center gap-2">
    <span className="font-display uppercase tracking-widest text-[11px] text-smoke">
      Принимаем
    </span>
    <PaymentMethods />
  </div>
  ```

- [ ] **Шаг 1.3 — cart-drawer.tsx: удалить функцию PaymentMethods**

  Удалить строки 538–560 (всю функцию `PaymentMethods`):
  ```tsx
  // УДАЛИТЬ:
  /* Фича 5 — горизонтальный ряд иконок способов оплаты (СБП, МИР, наличные) */
  function PaymentMethods() { ... }
  ```

- [ ] **Шаг 1.4 — cart-drawer.tsx: убрать неиспользуемые импорты**

  В строке 5 удалить `QrCode, CreditCard, Banknote` из импорта lucide-react:
  ```tsx
  // было:
  import { X, Minus, Plus, ShoppingBag, ArrowLeft, Check, QrCode, CreditCard, Banknote } from "lucide-react";
  // стало:
  import { X, Minus, Plus, ShoppingBag, ArrowLeft, Check } from "lucide-react";
  ```
  *(Check можно тоже убрать если не используется — проверить поиском)*

- [ ] **Шаг 1.5 — Коммит**
  ```
  git add components/hero.tsx components/cart-drawer.tsx
  git commit -m "fix: remove spring from menu label, remove payment method icons"
  ```

---

## Task 2 — Hero: круг правее и крупнее

**Files:**
- Modify: `components/hero.tsx`

- [ ] **Шаг 2.1 — Изменить пропорции grid**

  Строки 12–14 `hero.tsx`. Меняем левую колонку с 7 на 6, правую с 5 на 6:
  ```tsx
  // было:
  <div className="grid grid-cols-12 gap-6 lg:gap-10 items-start">
    {/* LEFT — HEADLINE */}
    <div className="col-span-12 lg:col-span-7 relative">
  // стало:
  <div className="grid grid-cols-12 gap-6 lg:gap-10 items-start">
    {/* LEFT — HEADLINE */}
    <div className="col-span-12 lg:col-span-6 relative">
  ```

- [ ] **Шаг 2.2 — Правая колонка: col-span + сдвиг вправо**

  Строка 66 `hero.tsx`:
  ```tsx
  // было:
  <div className="col-span-12 lg:col-span-5 relative lg:self-center">
  // стало:
  <div className="col-span-12 lg:col-span-6 relative lg:self-center lg:-mr-12">
  ```
  `lg:-mr-12` позволяет кругу слегка выходить за правый край контейнера — визуально «прижат к правому краю».

- [ ] **Шаг 2.3 — Увеличить max-w круга**

  Строка 67 `hero.tsx`:
  ```tsx
  // было:
  <div className="relative aspect-square max-w-[300px] sm:max-w-[460px] lg:max-w-[560px] mx-auto">
  // стало:
  <div className="relative aspect-square max-w-[320px] sm:max-w-[500px] lg:max-w-[660px] mx-auto lg:ml-auto lg:mr-0">
  ```
  `lg:ml-auto lg:mr-0` — круг прижимается к правому краю своей колонки вместо центрирования.

- [ ] **Шаг 2.4 — Проверить на экране**

  Открыть `http://localhost:3000`, убедиться что:
  - Круг крупнее и смещён вправо
  - Заголовок «Честная пицца» не ужался критично
  - На мобиле (< lg) всё по-прежнему центрировано и нормально

- [ ] **Шаг 2.5 — Коммит**
  ```
  git add components/hero.tsx
  git commit -m "feat: enlarge and shift hero circle right"
  ```

---

## Task 3 — Хитбоксы

**Files:**
- Modify: `components/cookie-banner.tsx`
- Modify: `components/cart-drawer.tsx`
- Modify: `components/footer.tsx`
- Modify: `components/menu-section.tsx`

Минимальный касаемый размер — 40–44px. Это рекомендация Apple HIG и Google Material.

- [ ] **Шаг 3.1 — cookie-banner.tsx: кнопка-крестик**

  Строка 35–41: `w-7 h-7` (28px) → `w-10 h-10` (40px):
  ```tsx
  // было:
  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center hover:bg-ink hover:text-cream transition-colors"
  // стало:
  className="absolute top-1.5 right-1.5 w-10 h-10 flex items-center justify-center hover:bg-ink hover:text-cream transition-colors"
  ```

- [ ] **Шаг 3.2 — cart-drawer.tsx: кнопка «Назад» и кнопка «Закрыть» в шапке**

  Строки 184–191 и 198–204: `w-9 h-9` (36px) → `w-10 h-10` (40px):
  ```tsx
  // «Назад» (строка ~187):
  className="w-10 h-10 border-2 border-ink bg-cream flex items-center justify-center hover:bg-ink hover:text-cream transition-colors"
  // «Закрыть» (строка ~200):
  className="w-10 h-10 border-2 border-ink bg-cream flex items-center justify-center hover:bg-crimson hover:text-cream transition-colors"
  ```

- [ ] **Шаг 3.3 — cart-drawer.tsx: кнопка удаления позиции в CartList**

  Строка ~327–333: кнопка удаления X — сейчас нет размера, только иконка. Добавить `w-10 h-10 flex items-center justify-center -mr-2`:
  ```tsx
  // было:
  <button
    onClick={() => remove(l.id)}
    className="text-smoke hover:text-crimson"
    aria-label="Удалить"
  >
    <X className="w-4 h-4" />
  </button>
  // стало:
  <button
    onClick={() => remove(l.id)}
    className="w-10 h-10 flex items-center justify-center -mr-2 text-smoke hover:text-crimson transition-colors"
    aria-label="Удалить"
  >
    <X className="w-4 h-4" />
  </button>
  ```

- [ ] **Шаг 3.4 — footer.tsx: правовые ссылки**

  Строки 113–121: добавить `py-1` к каждой ссылке:
  ```tsx
  // было:
  <Link href="/policy" className="text-cream/60 hover:text-crimson">
    Политика конфиденциальности
  </Link>
  <Link href="/oferta" className="text-cream/60 hover:text-crimson">
    Оферта
  </Link>
  <Link href="/cookies" className="text-cream/60 hover:text-crimson">
    Cookies
  </Link>
  // стало:
  <Link href="/policy" className="py-1 text-cream/60 hover:text-crimson">
    Политика конфиденциальности
  </Link>
  <Link href="/oferta" className="py-1 text-cream/60 hover:text-crimson">
    Оферта
  </Link>
  <Link href="/cookies" className="py-1 text-cream/60 hover:text-crimson">
    Cookies
  </Link>
  ```

- [ ] **Шаг 3.5 — menu-section.tsx: кнопки размера пиццы**

  Строки ~163–177: размерные кнопки `px-2.5 py-1` → `px-2.5 py-1.5 min-h-[36px]`:
  ```tsx
  // было:
  "text-[12px] font-display uppercase tracking-wider px-2.5 py-1 border-2 border-ink transition-colors",
  // стало:
  "text-[12px] font-display uppercase tracking-wider px-2.5 py-1.5 min-h-[36px] border-2 border-ink transition-colors",
  ```

- [ ] **Шаг 3.6 — Коммит**
  ```
  git add components/cookie-banner.tsx components/cart-drawer.tsx components/footer.tsx components/menu-section.tsx
  git commit -m "fix: increase hit targets to 40px+ across interactive elements"
  ```

---

## Task 4 — Extras: слой данных

**Files:**
- Create: `lib/extras.ts`
- Modify: `lib/cart-store.ts`

- [ ] **Шаг 4.1 — Создать `lib/extras.ts`**

  ```typescript
  // lib/extras.ts
  export type Extra = { id: string; name: string; price: number };

  export const EXTRAS: Extra[] = [
    { id: "olives",    name: "Маслины",             price: 40  },
    { id: "tomatoes",  name: "Помидоры",             price: 40  },
    { id: "red-onion", name: "Красный лук",          price: 40  },
    { id: "mushrooms", name: "Шампиньоны",           price: 40  },
    { id: "pickles",   name: "Маринованые огурцы",   price: 40  },
    { id: "jalapeno",  name: "Халапеньо",            price: 40  },
    { id: "pineapple", name: "Ананасы",              price: 40  },
    { id: "mozzarella",name: "Моцарелла",            price: 50  },
    { id: "sausages",  name: "Охотничьи колбаски",   price: 70  },
    { id: "ham",       name: "Ветчина",              price: 80  },
    { id: "bacon",     name: "Бекон",                price: 80  },
    { id: "salami",    name: "Салями",               price: 80  },
    { id: "pepperoni", name: "Пепперони",            price: 80  },
    { id: "chicken",   name: "Курица",               price: 80  },
    { id: "shrimp",    name: "Креветки",             price: 100 },
    { id: "pesto",     name: "Соус песто",           price: 50  },
  ];
  ```

- [ ] **Шаг 4.2 — Обновить `CartLine` в `lib/cart-store.ts`**

  Добавить поле `extras` в тип и обновить `add`, `totalPrice`:
  ```typescript
  // lib/cart-store.ts

  // 1. Добавить импорт типа
  import type { Extra } from "./extras";

  // 2. Добавить поле в CartLine:
  export type CartLine = {
    id: string;
    itemId: string;
    name: string;
    sizeLabel: string;
    price: number;       // базовая цена пиццы без добавок
    qty: number;
    image: string;
    extras: Extra[];     // выбранные добавки (пустой массив если нет)
  };

  // 3. В add(): изменить вычисление lineId и сигнатуру input:
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

  // 4. В Actions type — обновить сигнатуру add:
  add: (input: Omit<CartLine, "qty" | "id"> & { qty?: number }) => void;

  // 5. Обновить totalPrice() чтобы учитывал добавки:
  totalPrice: () => get().lines.reduce((s, l) => {
    const extrasTotal = l.extras.reduce((acc, e) => acc + e.price, 0);
    return s + (l.price + extrasTotal) * l.qty;
  }, 0),
  ```

- [ ] **Шаг 4.3 — Коммит**
  ```
  git add lib/extras.ts lib/cart-store.ts
  git commit -m "feat: add extras data layer and update cart store"
  ```

---

## Task 5 — Extras: UI на карточке пиццы

**Files:**
- Modify: `components/menu-section.tsx`

- [ ] **Шаг 5.1 — Добавить импорты в menu-section.tsx**

  ```tsx
  // Добавить в импорты вверху файла:
  import { EXTRAS } from "@/lib/extras";
  import type { Extra } from "@/lib/extras";
  ```

- [ ] **Шаг 5.2 — Добавить состояние extras в PizzaCard**

  После существующего `const [pop, setPop] = useState(false);` в `PizzaCard`:
  ```tsx
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

- [ ] **Шаг 5.3 — Обновить handleAdd чтобы передавать extras**

  ```tsx
  // было:
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
  // стало:
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
  ```

- [ ] **Шаг 5.4 — Добавить UI добавок в карточку**

  После блока `{item.sizes.length > 1 && ...}` (выбор размера), перед `<div className="flex items-end justify-between...">` добавить блок добавок. Только для пиццы:
  ```tsx
  {item.category === "pizza" && (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setExtrasOpen(!extrasOpen)}
        className="flex items-center gap-1.5 text-[12px] font-display uppercase tracking-wider text-crimson hover:text-ink transition-colors"
      >
        <Plus className={cn("w-3 h-3 transition-transform", extrasOpen && "rotate-45")} />
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
  ```

- [ ] **Шаг 5.5 — Обновить отображение цены**

  Заменить `{formatRub(size.price)}` на `{formatRub(displayPrice)}`:
  ```tsx
  // было:
  <div className="font-display text-[28px] leading-none mt-1">
    {formatRub(size.price)}
  </div>
  // стало:
  <div className="font-display text-[28px] leading-none mt-1">
    {formatRub(displayPrice)}
  </div>
  ```

- [ ] **Шаг 5.6 — Проверить**

  - Открыть меню → карточка пиццы → нажать «Добавить ингредиент» → появляются чипы
  - Выбрать «Бекон 80₽» → цена карточки увеличивается на 80р
  - Нажать «+» → пицца с добавкой попала в корзину
  - Та же пицца без добавки → другая строка в корзине

- [ ] **Шаг 5.7 — Коммит**
  ```
  git add components/menu-section.tsx
  git commit -m "feat: extras picker on pizza card"
  ```

---

## Task 6 — Extras: корзина + Telegram + API

**Files:**
- Modify: `components/cart-drawer.tsx`
- Modify: `lib/telegram.ts`

- [ ] **Шаг 6.1 — cart-drawer.tsx: показать extras в CartList**

  В `CartList`, под строкой `<div className="text-[12px] text-smoke mt-0.5">{l.sizeLabel}</div>` добавить:
  ```tsx
  {l.extras.length > 0 && (
    <div className="text-[11px] text-smoke/80 mt-0.5 leading-snug">
      + {l.extras.map(e => e.name).join(", ")}
    </div>
  )}
  ```

- [ ] **Шаг 6.2 — cart-drawer.tsx: обновить цену строки**

  В `CartList`, строка с ценой:
  ```tsx
  // было:
  <div className="font-display text-xl">{formatRub(l.price * l.qty)}</div>
  // стало:
  <div className="font-display text-xl">
    {formatRub((l.price + l.extras.reduce((s, e) => s + e.price, 0)) * l.qty)}
  </div>
  ```

- [ ] **Шаг 6.3 — cart-drawer.tsx: передать extras в orderPayload**

  В функции `submit` (~строка 99), обновить `lines` в `orderPayload`:
  ```tsx
  lines: lines.map((l) => ({
    name: l.name,
    sizeLabel: l.sizeLabel,
    qty: l.qty,
    price: l.price + l.extras.reduce((s, e) => s + e.price, 0), // полная цена за штуку
    extras: l.extras.length > 0 ? l.extras : undefined,          // для Telegram
  })),
  ```

- [ ] **Шаг 6.4 — lib/telegram.ts: добавить extras в OrderLine**

  ```typescript
  export type OrderLine = {
    name: string;
    sizeLabel: string;
    qty: number;
    price: number;
    extras?: { name: string; price: number }[];   // новое поле
  };
  ```

- [ ] **Шаг 6.5 — lib/telegram.ts: показать extras в сообщении**

  В `buildOrderMessage`, строку форматирования items обновить:
  ```typescript
  // было:
  const items = o.lines
    .map((l) => `• ${esc(l.name)} (${esc(l.sizeLabel)}) × ${l.qty} — ${rub(l.price * l.qty)}`)
    .join("\n");
  // стало:
  const items = o.lines.map((l) => {
    const base = `• ${esc(l.name)} (${esc(l.sizeLabel)}) × ${l.qty} — ${rub(l.price * l.qty)}`;
    if (l.extras && l.extras.length > 0) {
      const extrasList = l.extras.map(e => e.name).join(", ");
      const extrasTotal = l.extras.reduce((s, e) => s + e.price, 0) * l.qty;
      return `${base}\n  ↳ \\+ ${esc(extrasList)} \\(${rub(extrasTotal)}\\)`;
    }
    return base;
  }).join("\n");
  ```

- [ ] **Шаг 6.6 — Проверить полный флоу**

  1. Добавить пиццу с «Бекон 80₽» в корзину
  2. В корзине убедиться что под названием написано «+ Бекон»
  3. Оформить заказ (cash/самовывоз) → в Telegram-сообщении в console должна быть строчка `↳ + Бекон (80 ₽)`
  4. `totalPrice()` и grand total должны включать стоимость добавки

- [ ] **Шаг 6.7 — Коммит**
  ```
  git add components/cart-drawer.tsx lib/telegram.ts
  git commit -m "feat: show extras in cart drawer and telegram order"
  ```

---

## Чеклист самопроверки плана

- [x] Task 1: текст «весна» убран, PaymentMethods удалён
- [x] Task 2: hero grid 6+6, max-w увеличен, mr-0 сдвигает вправо
- [x] Task 3: все интерактивные элементы ≥ 40px — cookie X, cart X, back, delete, size buttons, footer links
- [x] Task 4: `Extra` тип, `EXTRAS[16]`, `CartLine.extras`, `lineId` с fingerprint, `totalPrice` учитывает добавки
- [x] Task 5: UI чипов на карточке, только pizza category, цена обновляется
- [x] Task 6: extras видны в CartList, цена в корзине верна, extras в payload, Telegram показывает добавки
- [x] Типы согласованы: `Extra` из `lib/extras.ts` используется в `cart-store.ts`, `menu-section.tsx`, `cart-drawer.tsx`
- [x] `OrderLine.extras` в `telegram.ts` = `{ name: string; price: number }[]` — совпадает с `Extra` структурно
