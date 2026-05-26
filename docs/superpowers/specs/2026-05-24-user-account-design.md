# Личный кабинет пользователя — Design Spec

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Добавить авторизацию по SMS и личный кабинет с профилем и историей заказов.

**Architecture:** SMS OTP через SMSC.ru → JWT в httpOnly cookie → Supabase PostgreSQL для хранения пользователей и заказов. Минимальная зависимость от внешних библиотек.

**Tech Stack:** Next.js 16 App Router, Supabase JS SDK, SMSC.ru REST API, JWT (jose), Tailwind CSS

---

## 1. База данных (Supabase)

Три таблицы:

```sql
-- Пользователи
create table users (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,   -- формат: +79991234567
  name text,
  address text,
  created_at timestamptz default now()
);

-- OTP коды (живут 5 минут)
create table otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,           -- 4 цифры
  expires_at timestamptz not null,
  used boolean default false
);

-- Заказы (пишутся только для авторизованных пользователей)
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  lines jsonb not null,         -- CartLine[]
  total integer not null,       -- в рублях
  address text,
  payment text,                 -- 'cash' | 'card_courier' | 'online'
  created_at timestamptz default now()
);
```

Row Level Security: включён, пользователь видит только свои строки (через JWT claim `sub` = `user_id`).

---

## 2. Авторизация — флоу

```
1. Пользователь вводит телефон
2. POST /api/auth/send-code
   → нормализует номер (+7...)
   → генерирует 4-значный код
   → сохраняет в otp_codes (expires_at = now() + 5 min)
   → отправляет SMS через SMSC.ru
   → возвращает { ok: true }

3. Пользователь вводит код
4. POST /api/auth/verify-code
   → ищет otp_codes по phone + code + used=false + expires_at > now()
   → если не найден → { error: "Неверный код" }
   → если найден → помечает used=true
   → ищет или создаёт users по phone
   → генерирует JWT (payload: { sub: user.id, phone }, exp: 7 дней)
   → ставит httpOnly cookie "session" со значением JWT
   → возвращает { ok: true, user: { id, phone, name, address } }

5. GET /api/auth/me
   → читает cookie "session"
   → верифицирует JWT
   → возвращает { user } или 401

6. POST /api/auth/logout
   → удаляет cookie "session"
   → возвращает { ok: true }
```

---

## 3. API роуты

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/auth/send-code` | Отправить SMS с кодом |
| POST | `/api/auth/verify-code` | Проверить код, выдать сессию |
| GET | `/api/auth/me` | Получить текущего пользователя |
| POST | `/api/auth/logout` | Выйти |
| PATCH | `/api/account/profile` | Обновить имя и адрес |
| GET | `/api/account/orders` | История заказов |

Существующий `/api/order` и `/api/payment` дополняются: если в запросе есть валидная сессия — `user_id` пишется в БД при создании заказа.

---

## 4. SMS провайдер (SMSC.ru)

Переменные окружения:
```
SMSC_LOGIN=...
SMSC_PASSWORD=...
```

Запрос:
```
GET https://smsc.ru/sys/send.php
  ?login=<login>
  &psw=<password>
  &phones=<phone>
  &mes=Ваш код Pizzagram: <code>
  &fmt=3   (JSON ответ)
```

Утилита `lib/sms.ts` — функция `sendSms(phone, code)`. Если переменные окружения не заданы (dev-режим) — логирует код в консоль вместо отправки.

---

## 5. JWT сессии

Библиотека: `jose` (уже может быть в node_modules через next-auth, иначе устанавливается отдельно — легковесная).

```
JWT_SECRET=<случайная строка 32+ символа> в .env.local
```

Cookie: `session`, `httpOnly`, `sameSite: lax`, `maxAge: 7 дней`, `path: /`.

Утилита `lib/session.ts`:
- `signSession(userId, phone): Promise<string>`
- `verifySession(token: string): Promise<{ sub: string; phone: string }>`
- `getSession(req): Promise<SessionPayload | null>` — читает cookie из Request

---

## 6. UI компоненты

### `components/auth-modal.tsx`
Модал авторизации. Два шага:
- **Шаг 1** — поле телефона + кнопка «Получить код»
- **Шаг 2** — 4 отдельных input для цифр кода + таймер 60 сек для повтора

Стиль: в духе существующего neobrutalism (border-2 border-ink, font-display, bg-cream).

### `components/user-menu.tsx`
Кнопка в шапке. Состояния:
- **Не авторизован** → кнопка «Войти», открывает AuthModal
- **Авторизован** → иконка пользователя + имя (или телефон если имя не задано), dropdown: «Кабинет» / «Выйти»

### `app/account/page.tsx`
Страница `/account` — защищённая (редирект на главную если не авторизован).

Два блока:
1. **Мои данные** — поля имя + адрес, кнопка «Сохранить»; телефон показывается как нередактируемый
2. **Мои заказы** — список заказов: дата, позиции, сумма (порядок — новые первые)

### `lib/auth-store.ts`
Zustand store для клиента:
```ts
type AuthState = {
  user: { id: string; phone: string; name?: string; address?: string } | null;
  loading: boolean;
  setUser: (user: AuthState['user']) => void;
  logout: () => void;
}
```
Инициализируется через `GET /api/auth/me` при загрузке приложения (`useEffect` в `app/layout.tsx` или `components/auth-provider.tsx`).

---

## 7. Интеграция с заказами

В `/api/order/route.ts` и `/api/payment/route.ts`:
```ts
const session = await getSession(req);
if (session) {
  await supabase.from('orders').insert({
    user_id: session.sub,
    lines: payload.lines,
    total: payload.total,
    address: payload.address,
    payment: payload.payment,
  });
}
```
Если пользователь не авторизован — заказ в Telegram уходит как обычно, в БД не пишется. Ничего не ломается.

---

## 8. Автозаполнение формы заказа

В `components/cart-drawer.tsx`: если `auth-store.user` существует — поля имени, телефона и адреса заполняются автоматически при открытии корзины. Пользователь может изменить вручную перед отправкой.

---

## 9. Переменные окружения

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# SMS
SMSC_LOGIN=
SMSC_PASSWORD=

# JWT
JWT_SECRET=
```

---

## 10. Ограничения MVP

- Один адрес доставки (не несколько)
- Нет повтора заказа одной кнопкой
- Нет статуса заказа в реальном времени
- История только для заказов, сделанных после регистрации
- Нет смены телефона
