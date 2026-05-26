-- ============================================================
-- Pizzagram — схема базы данных
-- Запускать в Supabase: SQL Editor → New query → Run
-- ============================================================

-- Пользователи (авторизация по телефону)
create table if not exists public.users (
  id         uuid        primary key default gen_random_uuid(),
  phone      text        unique not null,
  name       text,
  address    text,
  created_at timestamptz not null default now()
);

-- OTP-коды для входа по SMS
create table if not exists public.otp_codes (
  id         uuid        primary key default gen_random_uuid(),
  phone      text        not null,
  code       text        not null,
  expires_at timestamptz not null,
  used       boolean     not null default false,
  created_at timestamptz not null default now()
);

-- Заказы
create table if not exists public.orders (
  id         uuid         primary key default gen_random_uuid(),
  user_id    uuid         references public.users(id) on delete set null,
  lines      jsonb        not null default '[]',
  total      numeric(10,2) not null default 0,
  address    text,
  payment    text         not null default 'cash',
  created_at timestamptz  not null default now()
);

-- Индексы
create index if not exists idx_otp_phone      on public.otp_codes (phone);
create index if not exists idx_otp_expires    on public.otp_codes (expires_at);
create index if not exists idx_orders_user    on public.orders (user_id);
create index if not exists idx_orders_created on public.orders (created_at desc);

-- RLS включён — прямой доступ через браузер невозможен.
-- Приложение использует service_role ключ (обходит RLS), поэтому
-- отдельные политики не нужны. Anon-ключ не используется вообще.
alter table public.users     enable row level security;
alter table public.otp_codes enable row level security;
alter table public.orders    enable row level security;
