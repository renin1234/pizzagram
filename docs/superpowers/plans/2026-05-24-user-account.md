# User Account — Personal Cabinet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SMS OTP авторизация + личный кабинет с профилем и историей заказов.

**Architecture:** SMSC.ru отправляет SMS-код → код верифицируется против `otp_codes` в Supabase → выдаётся JWT (7 дней) в httpOnly cookie → профиль и история хранятся в Supabase PostgreSQL. Неавторизованные пользователи работают как раньше.

**Tech Stack:** Next.js 16 App Router, @supabase/supabase-js, jose (JWT), SMSC.ru REST API, Zustand, Tailwind CSS

---

## Карта файлов

**Создать:**
- `lib/supabase.ts` — серверный клиент Supabase (service_role, обходит RLS)
- `lib/sms.ts` — `sendSms(phone, code)` через SMSC.ru
- `lib/session.ts` — `signSession`, `verifySession`, `getSession` (JWT + cookie)
- `lib/auth-store.ts` — Zustand store авторизации (client)
- `components/auth-provider.tsx` — инициализирует auth на старте
- `components/auth-modal.tsx` — 2-шаговый модал (телефон → код)
- `components/user-menu.tsx` — кнопка в шапке (Войти / иконка юзера)
- `app/api/auth/send-code/route.ts`
- `app/api/auth/verify-code/route.ts`
- `app/api/auth/me/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/account/profile/route.ts`
- `app/api/account/orders/route.ts`
- `app/account/page.tsx`

**Изменить:**
- `app/layout.tsx` — добавить `<AuthProvider />`
- `components/header.tsx` — добавить `<UserMenu />` слева от корзины
- `app/api/order/route.ts` — записывать заказ в БД если есть сессия
- `app/api/payment/route.ts` — сохранять `userId` в pending-order JSON
- `app/api/payment-webhook/route.ts` — записывать заказ в БД после оплаты
- `components/cart-drawer.tsx` — автозаполнение полей из auth store

---

## Task 1: Зависимости и переменные окружения

**Files:**
- Modify: `package.json` (через npm install)
- Modify: `.env.local`

- [ ] **Шаг 1: Установить зависимости**

```bash
cd C:\Users\l1ndl\Desktop\pizzagram
npm install @supabase/supabase-js jose
```

Ожидание: `added N packages` без ошибок.

- [ ] **Шаг 2: Добавить переменные в `.env.local`**

Открыть `.env.local` и добавить в конец:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# SMS (SMSC.ru — https://smsc.ru)
SMSC_LOGIN=your_login
SMSC_PASSWORD=your_password

# JWT — случайная строка 32+ символа
JWT_SECRET=replace_with_random_string_at_least_32_chars
```

Значения Supabase взять из: Supabase Dashboard → Project Settings → API.
JWT_SECRET сгенерировать: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

- [ ] **Шаг 3: Проверить сборку**

```bash
npm run build
```

Ожидание: успешная сборка. Ошибки типа "Module not found" не должны появиться.

---

## Task 2: Supabase — таблицы и серверный клиент

**Files:**
- Create: `lib/supabase.ts`

- [ ] **Шаг 1: Создать таблицы в Supabase Dashboard**

Открыть Supabase Dashboard → SQL Editor → выполнить:

```sql
-- Пользователи
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique,
  name text,
  address text,
  created_at timestamptz default now()
);

-- OTP коды (TTL 5 минут)
create table if not exists otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);

-- Индекс для быстрого поиска по телефону
create index if not exists otp_codes_phone_idx on otp_codes(phone);

-- Заказы
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  lines jsonb not null,
  total integer not null,
  address text,
  payment text,
  created_at timestamptz default now()
);
```

Ожидание: таблицы появятся в Table Editor.

- [ ] **Шаг 2: Создать `lib/supabase.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Серверный клиент — использует service_role key, обходит RLS.
// Используется только в API routes (серверная сторона).
export const supabase = createClient(url, serviceKey);
```

- [ ] **Шаг 3: Проверить сборку**

```bash
npm run build
```

Ожидание: сборка без ошибок.

---

## Task 3: lib/sms.ts — отправка SMS через SMSC.ru

**Files:**
- Create: `lib/sms.ts`

- [ ] **Шаг 1: Создать `lib/sms.ts`**

```typescript
/**
 * Отправляет SMS с кодом через SMSC.ru.
 * В режиме разработки (SMSC_LOGIN не задан) — выводит код в консоль.
 */
export async function sendSms(phone: string, code: string): Promise<void> {
  const login = process.env.SMSC_LOGIN;
  const password = process.env.SMSC_PASSWORD;

  if (!login || !password) {
    console.log(`[SMS DEV] Код для ${phone}: ${code}`);
    return;
  }

  const params = new URLSearchParams({
    login,
    psw: password,
    phones: phone,
    mes: `Ваш код Pizzagram: ${code}`,
    fmt: "3", // JSON ответ
    charset: "utf-8",
  });

  const res = await fetch(`https://smsc.ru/sys/send.php?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`SMSC HTTP error: ${res.status}`);
  }

  const data = await res.json();
  // SMSC возвращает { error_code: N } при ошибке
  if (data.error_code) {
    throw new Error(`SMSC error ${data.error_code}: ${data.error ?? "unknown"}`);
  }
}
```

- [ ] **Шаг 2: Проверить сборку**

```bash
npm run build
```

Ожидание: сборка без ошибок.

---

## Task 4: lib/session.ts — JWT в httpOnly cookie

**Files:**
- Create: `lib/session.ts`

- [ ] **Шаг 1: Создать `lib/session.ts`**

```typescript
import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 дней в секундах

export type SessionPayload = {
  sub: string;   // user.id
  phone: string;
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET не задан в .env.local");
  return new TextEncoder().encode(secret);
}

export async function signSession(userId: string, phone: string): Promise<string> {
  return new SignJWT({ sub: userId, phone })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getSecret());
  return { sub: payload.sub as string, phone: payload.phone as string };
}

/** Читает cookie "session" из входящего запроса (Request). */
export async function getSessionFromRequest(req: Request): Promise<SessionPayload | null> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  try {
    return await verifySession(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

/** Строит заголовок Set-Cookie для выдачи сессии. */
export function buildSessionCookie(token: string): string {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}`;
}

/** Строит заголовок Set-Cookie для очистки сессии. */
export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}
```

- [ ] **Шаг 2: Проверить сборку**

```bash
npm run build
```

Ожидание: сборка без ошибок.

---

## Task 5: POST /api/auth/send-code

**Files:**
- Create: `app/api/auth/send-code/route.ts`

- [ ] **Шаг 1: Создать `app/api/auth/send-code/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendSms } from "@/lib/sms";

/** Нормализует телефон в формат +7XXXXXXXXXX */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) {
    return "+7" + digits.slice(1);
  }
  if (digits.length === 10) {
    return "+7" + digits;
  }
  return null;
}

export async function POST(req: Request) {
  let body: { phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "");
  if (!phone) {
    return NextResponse.json({ error: "Неверный формат телефона" }, { status: 400 });
  }

  // Удаляем устаревшие/неиспользованные коды для этого номера
  await supabase
    .from("otp_codes")
    .delete()
    .eq("phone", phone)
    .eq("used", false);

  // Генерируем 4-значный код
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("otp_codes")
    .insert({ phone, code, expires_at: expiresAt });

  if (error) {
    console.error("otp_codes insert error:", error);
    return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
  }

  try {
    await sendSms(phone, code);
  } catch (err) {
    console.error("SMS send error:", err);
    return NextResponse.json({ error: "Не удалось отправить SMS" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Шаг 2: Проверить сборку**

```bash
npm run build
```

Ожидание: сборка без ошибок.

- [ ] **Шаг 3: Проверить вручную (dev-режим)**

```bash
npm run dev
```

Открыть другой терминал:

```bash
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"89991234567\"}"
```

Ожидание: `{"ok":true}` и в консоли dev-сервера: `[SMS DEV] Код для +79991234567: XXXX`.

---

## Task 6: POST /api/auth/verify-code

**Files:**
- Create: `app/api/auth/verify-code/route.ts`

- [ ] **Шаг 1: Создать `app/api/auth/verify-code/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { signSession, buildSessionCookie } from "@/lib/session";

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && (digits[0] === "7" || digits[0] === "8")) {
    return "+7" + digits.slice(1);
  }
  if (digits.length === 10) return "+7" + digits;
  return null;
}

export async function POST(req: Request) {
  let body: { phone?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone ?? "");
  const code = (body.code ?? "").trim();

  if (!phone || !code) {
    return NextResponse.json({ error: "Не хватает данных" }, { status: 400 });
  }

  // Ищем актуальный код: не использован и не истёк
  const now = new Date().toISOString();
  const { data: otpRows, error: otpErr } = await supabase
    .from("otp_codes")
    .select("id")
    .eq("phone", phone)
    .eq("code", code)
    .eq("used", false)
    .gt("expires_at", now)
    .limit(1);

  if (otpErr || !otpRows || otpRows.length === 0) {
    return NextResponse.json({ error: "Неверный или устаревший код" }, { status: 400 });
  }

  // Помечаем код как использованный
  await supabase
    .from("otp_codes")
    .update({ used: true })
    .eq("id", otpRows[0].id);

  // Ищем или создаём пользователя
  let userId: string;
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, phone, name, address")
    .eq("phone", phone)
    .single();

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data: newUser, error: insertErr } = await supabase
      .from("users")
      .insert({ phone })
      .select("id, phone, name, address")
      .single();

    if (insertErr || !newUser) {
      console.error("User insert error:", insertErr);
      return NextResponse.json({ error: "Внутренняя ошибка" }, { status: 500 });
    }
    userId = newUser.id;
  }

  const user = existingUser ?? { id: userId, phone, name: null, address: null };
  const token = await signSession(userId, phone);

  return new Response(JSON.stringify({ ok: true, user }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": buildSessionCookie(token),
    },
  });
}
```

- [ ] **Шаг 2: Проверить сборку**

```bash
npm run build
```

- [ ] **Шаг 3: Проверить вручную**

```bash
# 1. Запросить код (заменить номер на настоящий или оставить тестовый)
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"89991234567\"}"

# 2. Взять код из консоли dev-сервера, подставить ниже
curl -X POST http://localhost:3000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"89991234567\", \"code\": \"XXXX\"}"
```

Ожидание: `{"ok":true,"user":{...}}` и в ответе заголовок `Set-Cookie: session=...`.

---

## Task 7: GET /api/auth/me + POST /api/auth/logout

**Files:**
- Create: `app/api/auth/me/route.ts`
- Create: `app/api/auth/logout/route.ts`

- [ ] **Шаг 1: Создать `app/api/auth/me/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, phone, name, address")
    .eq("id", session.sub)
    .single();

  if (error || !user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
```

- [ ] **Шаг 2: Создать `app/api/auth/logout/route.ts`**

```typescript
import { clearSessionCookie } from "@/lib/session";

export async function POST() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearSessionCookie(),
    },
  });
}
```

- [ ] **Шаг 3: Проверить сборку**

```bash
npm run build
```

---

## Task 8: PATCH /api/account/profile + GET /api/account/orders

**Files:**
- Create: `app/api/account/profile/route.ts`
- Create: `app/api/account/orders/route.ts`

- [ ] **Шаг 1: Создать `app/api/account/profile/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { supabase } from "@/lib/supabase";

export async function PATCH(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  let body: { name?: string; address?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (typeof body.name === "string") updates.name = body.name.trim();
  if (typeof body.address === "string") updates.address = body.address.trim();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Нечего обновлять" }, { status: 400 });
  }

  const { data: user, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", session.sub)
    .select("id, phone, name, address")
    .single();

  if (error || !user) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Ошибка обновления" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, user });
}
```

- [ ] **Шаг 2: Создать `app/api/account/orders/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, lines, total, address, payment, created_at")
    .eq("user_id", session.sub)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json({ error: "Ошибка получения заказов" }, { status: 500 });
  }

  return NextResponse.json({ orders: orders ?? [] });
}
```

- [ ] **Шаг 3: Проверить сборку**

```bash
npm run build
```

---

## Task 9: lib/auth-store.ts + components/auth-provider.tsx

**Files:**
- Create: `lib/auth-store.ts`
- Create: `components/auth-provider.tsx`
- Modify: `app/layout.tsx`

- [ ] **Шаг 1: Создать `lib/auth-store.ts`**

```typescript
"use client";

import { create } from "zustand";

export type AuthUser = {
  id: string;
  phone: string;
  name?: string | null;
  address?: string | null;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  authModalOpen: boolean;
};

type AuthActions = {
  setUser: (user: AuthUser | null) => void;
  setLoading: (v: boolean) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState & AuthActions>()((set) => ({
  user: null,
  loading: true,
  authModalOpen: false,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  openAuthModal: () => set({ authModalOpen: true }),
  closeAuthModal: () => set({ authModalOpen: false }),

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null });
  },
}));
```

- [ ] **Шаг 2: Создать `components/auth-provider.tsx`**

Этот компонент только инициализирует auth-состояние.
AuthModal рендерит UserMenu (Task 11) — чтобы не создавать зависимость между Task 9 и Task 10.

```typescript
"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-store";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuth((s) => s.setUser);
  const setLoading = useAuth((s) => s.setLoading);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user ?? null);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [setUser, setLoading]);

  return <>{children}</>;
}
```

- [ ] **Шаг 3: Обновить `app/layout.tsx`**

Заменить:

```typescript
import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import CookieBanner from "@/components/cookie-banner";
import PizzaCursor from "@/components/pizza-cursor";
import PizzaAssistant from "@/components/pizza-assistant";
import "./globals.css";
```

На:

```typescript
import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import CookieBanner from "@/components/cookie-banner";
import PizzaCursor from "@/components/pizza-cursor";
import PizzaAssistant from "@/components/pizza-assistant";
import AuthProvider from "@/components/auth-provider";
import "./globals.css";
```

И заменить тело `RootLayout`:

```typescript
  return (
    <html lang="ru" className={interTight.variable}>
      <body className="font-body antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <CookieBanner />
        <PizzaCursor />
        <PizzaAssistant />
      </body>
    </html>
  );
```

- [ ] **Шаг 4: Проверить сборку**

```bash
npm run build
```

---

## Task 10: components/auth-modal.tsx

**Files:**
- Create: `components/auth-modal.tsx`

- [ ] **Шаг 1: Создать `components/auth-modal.tsx`**

```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

type Props = { onClose: () => void };

export default function AuthModal({ onClose }: Props) {
  const setUser = useAuth((s) => s.setUser);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Закрытие по Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Таймер повторной отправки
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Ошибка"); return; }
      setStep("code");
      setCountdown(60);
    } catch {
      setError("Нет соединения");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Неверный код"); return; }
      setUser(data.user);
      onClose();
    } catch {
      setError("Нет соединения");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Вход в личный кабинет"
          className="relative w-full max-w-sm bg-cream border-2 border-ink shadow-[8px_8px_0_var(--ink)] p-6 sm:p-8"
        >
          {/* Крестик */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center border-2 border-ink hover:bg-crimson hover:text-cream transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="eyebrow text-crimson mb-1">
            {step === "phone" ? "Вход / Регистрация" : "Подтверждение"}
          </div>
          <h2 className="font-display uppercase text-2xl leading-tight mb-6">
            {step === "phone" ? "Ваш телефон" : "Введите код из SMS"}
          </h2>

          {step === "phone" ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 123-45-67"
                required
                autoFocus
                className="w-full border-2 border-ink bg-white px-4 py-3 font-body text-base focus:outline-none focus:border-crimson"
              />
              {error && <p className="text-crimson text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full font-display uppercase tracking-wider py-4 border-2 border-ink bg-crimson text-cream hover:bg-ink transition-colors disabled:opacity-60"
              >
                {loading ? "Отправка..." : "Получить код"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <p className="text-sm text-ink/60">
                Код отправлен на <span className="font-semibold text-ink">{phone}</span>
              </p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="0000"
                required
                autoFocus
                className="w-full border-2 border-ink bg-white px-4 py-3 font-display text-3xl tracking-[0.5em] text-center focus:outline-none focus:border-crimson"
              />
              {error && <p className="text-crimson text-sm">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full font-display uppercase tracking-wider py-4 border-2 border-ink bg-crimson text-cream hover:bg-ink transition-colors disabled:opacity-60"
              >
                {loading ? "Проверка..." : "Войти"}
              </button>
              <button
                type="button"
                disabled={countdown > 0}
                onClick={() => { setStep("phone"); setCode(""); setError(""); }}
                className="w-full text-sm text-ink/60 hover:text-ink disabled:text-ink/30 transition-colors"
              >
                {countdown > 0 ? `Повторить через ${countdown} сек` : "← Изменить номер"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Шаг 2: Проверить сборку**

```bash
npm run build
```

---

## Task 11: components/user-menu.tsx + header.tsx

**Files:**
- Create: `components/user-menu.tsx`
- Modify: `components/header.tsx`

- [ ] **Шаг 1: Создать `components/user-menu.tsx`**

UserMenu рендерит AuthModal когда `authModalOpen` истинно (AuthProvider не делает этого намеренно — избегаем проблем с порядком создания файлов).

```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-store";
import AuthModal from "@/components/auth-modal";
import { cn } from "@/lib/utils";

export default function UserMenu() {
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const openAuthModal = useAuth((s) => s.openAuthModal);
  const authModalOpen = useAuth((s) => s.authModalOpen);
  const closeAuthModal = useAuth((s) => s.closeAuthModal);
  const logout = useAuth((s) => s.logout);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Закрытие дропдауна при клике снаружи
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (loading) return null;

  if (!user) {
    return (
      <>
        <button
          onClick={openAuthModal}
          className="inline-flex items-center gap-2 border-2 border-ink bg-cream hover:bg-ink hover:text-cream transition-colors px-3 h-10 font-display uppercase tracking-wider text-sm"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Войти</span>
        </button>
        {authModalOpen && <AuthModal onClose={closeAuthModal} />}
      </>
    );
  }

  const displayName = user.name?.trim() || user.phone;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 border-2 border-ink px-3 h-10 font-display uppercase tracking-wider text-sm transition-colors",
          open ? "bg-ink text-cream" : "bg-cream hover:bg-ink hover:text-cream"
        )}
      >
        <User className="w-4 h-4" />
        <span className="hidden sm:inline max-w-[120px] truncate">{displayName}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-44 bg-cream border-2 border-ink shadow-[4px_4px_0_var(--ink)]">
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-3 font-display uppercase text-sm tracking-wider hover:bg-cream-deep transition-colors border-b-2 border-ink"
          >
            <User className="w-4 h-4" /> Кабинет
          </Link>
          <button
            onClick={() => { logout(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-3 font-display uppercase text-sm tracking-wider hover:bg-crimson hover:text-cream transition-colors"
          >
            <LogOut className="w-4 h-4" /> Выйти
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Шаг 2: Добавить UserMenu в `components/header.tsx`**

Добавить импорт после строки `import { cn, formatRub } from "@/lib/utils";`:

```typescript
import UserMenu from "@/components/user-menu";
```

Найти блок с кнопкой корзины (начинается с `<button onClick={openDrawer}`). Перед этой кнопкой вставить `<UserMenu />`:

```typescript
          {/* Кнопки справа */}
          <div className="flex items-center gap-2">
            <UserMenu />

            <button
              onClick={openDrawer}
              aria-label="Открыть корзину"
              className="relative inline-flex items-center gap-2 border-2 border-ink bg-cream hover:bg-ink hover:text-cream transition-colors px-3 h-10 font-display uppercase tracking-wider"
            >
              <ShoppingBag className={cn("w-4 h-4", shake && "cart-shake")} />
              <span className="hidden sm:inline">Корзина</span>
              <span
                className={cn(
                  "inline-flex items-center justify-center text-[11px] min-w-[20px] h-[20px] px-1 rounded-full font-bold transition-all",
                  count > 0 ? "bg-crimson text-cream" : "bg-cream-deep text-ink"
                )}
              >
                {count}
              </span>
              {count > 0 && (
                <span className="hidden sm:inline text-[13px] tabular-nums">
                  {formatRub(total)}
                </span>
              )}
            </button>
          </div>
```

То есть заменить существующую кнопку корзины (одиночный `<button>`) на `<div className="flex items-center gap-2">` с `<UserMenu />` внутри перед кнопкой корзины.

- [ ] **Шаг 3: Проверить сборку**

```bash
npm run build
```

- [ ] **Шаг 4: Проверить визуально**

```bash
npm run dev
```

Открыть http://localhost:3000. В шапке должна появиться кнопка «Войти». Нажать — открывается модал с полем телефона.

---

## Task 12: app/account/page.tsx

**Files:**
- Create: `app/account/page.tsx`

- [ ] **Шаг 1: Создать `app/account/page.tsx`**

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth, type AuthUser } from "@/lib/auth-store";
import { formatRub } from "@/lib/utils";

type OrderLine = {
  name: string;
  sizeLabel: string;
  price: number;
  qty: number;
  extras?: { name: string; price: number }[];
};

type Order = {
  id: string;
  lines: OrderLine[];
  total: number;
  address: string | null;
  payment: string;
  created_at: string;
};

export default function AccountPage() {
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const setUser = useAuth((s) => s.setUser);
  const router = useRouter();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Редирект если не авторизован
  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  // Заполнить поля из профиля
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setAddress(user.address ?? "");
    }
  }, [user]);

  // Загрузить историю заказов
  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    fetch("/api/account/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user as AuthUser);
        setSaveMsg("Сохранено ✓");
        setTimeout(() => setSaveMsg(""), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) return null;

  const paymentLabel: Record<string, string> = {
    cash: "Наличными",
    card_courier: "Картой курьеру",
    online: "Онлайн",
  };

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto max-w-[800px] px-4 sm:px-6 py-10 sm:py-16">

        {/* Назад */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-display uppercase tracking-wider text-sm hover:text-crimson transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> На главную
        </Link>

        <div className="eyebrow text-crimson mb-1">Личный кабинет</div>
        <h1 className="font-display uppercase text-[clamp(32px,6vw,64px)] leading-tight mb-10">
          {user.name?.trim() || user.phone}
        </h1>

        {/* Мои данные */}
        <section className="border-2 border-ink bg-cream p-6 sm:p-8 shadow-[6px_6px_0_var(--ink)] mb-8">
          <h2 className="font-display uppercase tracking-widest text-[11px] text-smoke mb-5">
            Мои данные
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="font-display uppercase text-[11px] tracking-widest text-smoke block mb-1.5">
                Имя
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Как вас зовут?"
                className="w-full border-2 border-ink bg-white px-4 py-3 font-body text-base focus:outline-none focus:border-crimson"
              />
            </div>
            <div>
              <label className="font-display uppercase text-[11px] tracking-widest text-smoke block mb-1.5">
                Телефон
              </label>
              <div className="w-full border-2 border-ink/30 bg-cream-deep px-4 py-3 font-body text-base text-ink/60">
                {user.phone}
              </div>
            </div>
            <div>
              <label className="font-display uppercase text-[11px] tracking-widest text-smoke block mb-1.5">
                Адрес доставки
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ул. Красных Партизан, 1/4 к.8, кв. 42"
                className="w-full border-2 border-ink bg-white px-4 py-3 font-body text-base focus:outline-none focus:border-crimson"
              />
            </div>
            <div className="flex items-center gap-4 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="font-display uppercase tracking-wider px-6 py-3 border-2 border-ink bg-crimson text-cream hover:bg-ink transition-colors disabled:opacity-60"
              >
                {saving ? "Сохранение..." : "Сохранить"}
              </button>
              {saveMsg && <span className="text-sm text-ink/60">{saveMsg}</span>}
            </div>
          </form>
        </section>

        {/* История заказов */}
        <section className="border-2 border-ink bg-cream p-6 sm:p-8 shadow-[6px_6px_0_var(--ink)]">
          <h2 className="font-display uppercase tracking-widest text-[11px] text-smoke mb-5">
            Мои заказы
          </h2>

          {ordersLoading && (
            <p className="text-ink/50 text-sm">Загрузка...</p>
          )}

          {!ordersLoading && orders.length === 0 && (
            <p className="text-ink/50 text-sm">Заказов пока нет</p>
          )}

          {!ordersLoading && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border-2 border-ink/20 p-4 hover:border-ink transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="font-display uppercase text-sm tracking-wider">
                      {new Date(order.created_at).toLocaleDateString("ru-RU", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </div>
                    <div className="font-display text-lg leading-none shrink-0">
                      {formatRub(order.total)}
                    </div>
                  </div>
                  <ul className="text-sm text-ink/70 space-y-0.5 mb-2">
                    {order.lines.map((l, i) => (
                      <li key={i}>
                        {l.name} ({l.sizeLabel}) × {l.qty}
                        {l.extras && l.extras.length > 0 && (
                          <span className="text-ink/50"> + {l.extras.map(e => e.name).join(", ")}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="text-[11px] font-display uppercase tracking-widest text-smoke">
                    {paymentLabel[order.payment] ?? order.payment}
                    {order.address && <> · {order.address}</>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
```

- [ ] **Шаг 2: Проверить сборку**

```bash
npm run build
```

- [ ] **Шаг 3: Проверить визуально**

```bash
npm run dev
```

Войти через модал → нажать «Кабинет» в дропдауне → открывается `/account` с формой профиля и пустым списком заказов.

---

## Task 13: Запись заказов в БД

**Files:**
- Modify: `app/api/order/route.ts`
- Modify: `app/api/payment/route.ts`
- Modify: `app/api/payment-webhook/route.ts`

- [ ] **Шаг 1: Обновить `app/api/order/route.ts`**

Добавить импорты в начало файла после существующих:

```typescript
import { getSessionFromRequest } from "@/lib/session";
import { supabase } from "@/lib/supabase";
```

В теле `POST`, после строки `const message = buildOrderMessage({ ...payload, paid: false });` и перед `try { const result = await sendToTelegram`:

```typescript
  // Если пользователь авторизован — сохраняем заказ в БД
  const session = await getSessionFromRequest(req);
  if (session) {
    const linesTotal = payload.lines.reduce((s, l) => s + l.price * l.qty, 0);
    await supabase.from("orders").insert({
      user_id: session.sub,
      lines: payload.lines,
      total: payload.total ?? linesTotal,
      address: payload.address ?? null,
      payment: payload.payment,
    }).catch((e) => console.error("DB order insert error:", e));
  }
```

- [ ] **Шаг 2: Обновить `app/api/payment/route.ts`**

Добавить импорты:

```typescript
import { getSessionFromRequest } from "@/lib/session";
```

После строки `const orderId = ...` и перед `const enrichedPayload`:

```typescript
  const session = await getSessionFromRequest(req);
  const userId = session?.sub ?? null;
  const enrichedPayload: OrderForMessage & { userId?: string | null } = {
    ...payload,
    orderId,
    userId,
  };
```

(Заменить существующую строку `const enrichedPayload: OrderForMessage = { ...payload, orderId };`)

- [ ] **Шаг 3: Обновить `app/api/payment-webhook/route.ts`**

Добавить импорты после существующих:

```typescript
import { supabase } from "@/lib/supabase";
```

После строки `const order = JSON.parse(...)` и перед `await fs.unlink(file)`, добавить сохранение в БД:

```typescript
      // Сохраняем оплаченный заказ в БД если был userId
      const userId = (order as { userId?: string | null }).userId;
      if (userId) {
        await supabase.from("orders").insert({
          user_id: userId,
          lines: order.lines,
          total: order.total,
          address: order.address ?? null,
          payment: "online",
        }).catch((e) => console.error("DB webhook order insert:", e));
      }
```

(Вставить прямо после `order = JSON.parse(...)`, перед `await fs.unlink(file)`)

- [ ] **Шаг 4: Проверить сборку**

```bash
npm run build
```

---

## Task 14: Автозаполнение корзины

**Files:**
- Modify: `components/cart-drawer.tsx`

- [ ] **Шаг 1: Добавить автозаполнение из auth store**

В `components/cart-drawer.tsx` найти импорты и добавить:

```typescript
import { useAuth } from "@/lib/auth-store";
```

Внутри компонента `CartDrawer` (или где объявлены состояния формы — `name`, `phone`, `address`) добавить после объявлений `useState`:

```typescript
  const authUser = useAuth((s) => s.user);

  // Автозаполнение при открытии корзины если пользователь авторизован
  useEffect(() => {
    if (authUser) {
      if (authUser.name) setName(authUser.name);
      if (authUser.phone) setPhone(authUser.phone);
      if (authUser.address) setAddress(authUser.address);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);
```

(Если в компоненте уже есть `useEffect` — добавить этот рядом с ними.)

- [ ] **Шаг 2: Проверить сборку**

```bash
npm run build
```

- [ ] **Шаг 3: Проверить визуально**

```bash
npm run dev
```

Войти через кабинет → заполнить имя и адрес → сохранить → открыть корзину → поля должны быть заполнены автоматически.

- [ ] **Шаг 4: Финальная проверка**

Открыть http://localhost:3000 и пройти полный флоу:
1. Войти (шапка → Войти → ввести телефон → код из консоли)
2. Кабинет → заполнить имя и адрес → Сохранить
3. Добавить пиццу в корзину → поля заполнены автоматически
4. Оформить заказ → в `/account` появляется запись в «Мои заказы»
5. Шапка → выйти → кнопка снова показывает «Войти»
