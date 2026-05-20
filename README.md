# PIZZAGRAM · Краснодар

Лендинг пиццерии Pizzagram на Next.js 14 (App Router) + Tailwind. Редизайн в стиле Roberta's Pizza, адаптированный под фирменную палитру Pizzagram (cream/ink/coral).

## Быстрый старт

```bash
npm install
npm run dev
# http://localhost:3000
```

Для production:

```bash
npm run build
npm start
```

## Структура

```
app/
  layout.tsx           — шрифты, мета, корневой layout
  page.tsx             — главная (собирает 7 секций + drawer)
  globals.css          — дизайн-система (CSS-переменные, утилиты)
  api/order/route.ts   — серверный endpoint → Telegram
components/
  header.tsx           — sticky шапка + утилитарный бар + бегущая строка
  hero.tsx             — первый экран
  menu-section.tsx     — табы категорий + сетка карточек пицц
  delivery.tsx         — доставка / самовывоз + стилизованная «карта»
  about.tsx            — блок «О нас» с коллажем
  reviews.tsx          — отзывы + соцсети
  footer.tsx           — футер с гигантским marquee
  cart-drawer.tsx      — выезжающая корзина + чекаут
  sticky-cta.tsx       — мобильная нижняя кнопка «Оформить»
lib/
  menu.ts              — каталог (заглушка под реальный)
  cart-store.ts        — Zustand-store корзины с persist в localStorage
  utils.ts             — cn() + formatRub()
```

## Дизайн-система

- **Палитра (брендбук Pizzagram):** `#F3E7E0` cream · `#1E1E1E` ink · `#FF4D39` crimson
- **Шрифты (все с кириллицей через Google Fonts):**
  - `Oswald` — все заголовки, кнопки, eyebrow-метки (condensed, uppercase)
  - `Unbounded` — резерв для широких акцентов
  - `Inter Tight` — основной body-шрифт (из брендбука)
  - `Lora Italic` — врезки/цитаты для редакционного контраста

## Telegram-интеграция

Endpoint: `POST /api/order` — принимает JSON, форматирует сообщение и шлёт в Telegram через Bot API.

### Подключение

1. Создайте бота через [@BotFather](https://t.me/BotFather), получите `TOKEN`.
2. Добавьте бота в нужный чат (личный или группу), отправьте туда любое сообщение.
3. Откройте `https://api.telegram.org/bot<TOKEN>/getUpdates` — найдите `chat.id`.
4. Создайте `.env.local` рядом с `.env.example`:

```env
TELEGRAM_BOT_TOKEN=7777777777:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
TELEGRAM_CHAT_ID=-1001234567890
```

5. Перезапустите `npm run dev`.

### Формат сообщения (из ТЗ)

```
🍕 Новый заказ Pizzagram

Имя: Иван
Телефон: +7 999 ...
Адрес: ул. Красная, 50

Состав заказа:
• Маргарита (32 см) × 1 — 390 ₽
• Кока-Кола (0.33 л) × 2 — 260 ₽

Сумма: 650 ₽
Доставка/самовывоз: Доставка
Комментарий: позвонить за 10 минут
```

### Поведение без токена

Если env-переменные не заданы, заказ **не падает**, а печатается в server console и возвращает `200 { ok:true, warning:"..." }`. Это удобно для демо и локальной разработки — корзина и форма работают полностью.

## Контент

Меню в `lib/menu.ts` — **правдоподобная заглушка**. Сайт pizzagram.ru был недоступен из песочницы во время сборки. Перед продом замените:

- Имена пицц, состав и цены — на реальные;
- Фото (сейчас — Unsplash placeholders) — на профессиональные фото вашего товара;
- Телефон, адрес, ОГРН/ИНН в футере;
- Ссылки соцсетей (`@pizzagram` — пример).

Категории меню: пицца / закуски / напитки / комбо. Раздел «Акции» убран по правкам заказчика.

## Корзина

- Zustand store с `persist` в `localStorage` (ключ `pizzagram-cart-v1`).
- При самовывозе автоматически применяется скидка −15%.
- Корзина открывается из шапки, на мобильных снизу появляется плавающая кнопка с итогом.

## Что добавить дальше

- Реальная карта (Яндекс/2ГИС iframe в `delivery.tsx`).
- Лента Instagram через embed или серверный fetch.
- Аналитика (Метрика).
- Страницы «Политика» и «Оферта» (сейчас заглушки в футере).
- Подмена Unsplash на собственные фото пицц.
- SEO: микроразметка `Restaurant` / `MenuItem` через JSON-LD в `layout.tsx`.
