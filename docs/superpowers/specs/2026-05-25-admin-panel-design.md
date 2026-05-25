# Admin Panel Design — Pizzagram

**Date:** 2026-05-25  
**Status:** Approved

---

## Goal

Add a password-protected admin panel at `/admin` with two sections:
1. **Orders** — view all orders from Supabase
2. **Menu** — add, edit, hide/show, and delete menu items stored in `data/menu.json`

---

## Authentication

- Single password stored in `ADMIN_PASSWORD` env variable (plain string, no hashing — compared via `crypto.timingSafeEqual` to prevent timing attacks).
- On correct password: sign a JWT → set `admin_session` cookie (httpOnly, sameSite: lax, 8-hour expiry). Uses the same `jose` library already in the project.
- `app/admin/layout.tsx` is a server component that reads the cookie and redirects to `/admin/login` if missing or invalid.
- Logout: `POST /api/admin/logout` clears the cookie.

---

## File Structure

### App routes
```
app/admin/
  layout.tsx              Server component — auth guard, redirects to /admin/login
  login/
    page.tsx              Login form (password input + submit button)
  orders/
    page.tsx              Orders table (server component, fetches Supabase)
  menu/
    page.tsx              Menu list with Add/Edit/Hide/Delete actions
    [id]/
      page.tsx            Edit form for a single menu item
```

### API routes
```
app/api/admin/
  login/route.ts          POST { password } → sets admin_session cookie
  logout/route.ts         POST → clears admin_session cookie
  orders/route.ts         GET → last 100 orders from Supabase (desc by created_at)
  menu/route.ts           GET → full menu array; POST → add new item
  menu/[id]/route.ts      GET → single item; PATCH → update item; DELETE → remove item
```

### Lib & data
```
data/
  menu.json               Menu data migrated from lib/menu.ts

lib/
  admin-session.ts        signAdminSession(password), verifyAdminSession(token),
                          getAdminSessionFromRequest(req), buildAdminCookie(),
                          clearAdminCookie()
  menu-data.ts            readMenu(): MenuItem[], writeMenu(items): void
                          getMenuItem(id), updateMenuItem(id, patch), deleteMenuItem(id), addMenuItem(item)
```

### Modified files
```
lib/menu.ts               Change export to re-read from menu-data.ts (backward compat)
```

---

## Data: Menu JSON

`data/menu.json` is the authoritative menu source. Shape mirrors existing `MenuItem` type from `lib/menu.ts`:

```ts
type MenuItem = {
  id: string;
  category: "pizza" | "snacks" | "drinks";
  name: string;
  ingredients: string;
  sizes: { label: string; price: number }[];
  image: string;
  badge?: "ХИТ" | "НОВОЕ" | "ВЕГ" | "ОСТРОЕ" | "−20%";
  feature?: boolean;
  imgScale?: number;
  hidden?: boolean;   // NEW — admin can hide items without deleting
}
```

`hidden: true` items are excluded from the public menu (filtered in `menu-data.ts`).

Migration: the existing `lib/menu.ts` array is serialised to `data/menu.json` once. `lib/menu.ts` then re-exports via `readMenu()` so all existing component imports (`import { menu } from "@/lib/menu"`) continue to work without change.

---

## Orders View

- Source: Supabase table `orders` (already exists, columns: `id`, `user_id`, `lines`, `total`, `address`, `payment`, `created_at`)
- Fetch: last 100 rows, ordered by `created_at DESC`
- Display columns: Date/time · Order ID · Address · Items (count + names) · Total · Payment method
- Manual refresh button (no real-time polling — Supabase realtime not needed at this scale)
- No status management (not in scope)

---

## UI / UX

Neobrutalism design consistent with the existing site:

- Colours: `--ink`, `--cream`, `--crimson` CSS variables already defined
- Borders: `border-2 border-ink` / `border-4 border-ink`
- Typography: existing font stack
- No new CSS framework — plain Tailwind with existing utility classes

### Login page
Centered card, password input, "Войти" button. Error text if wrong password.

### Orders page
Sticky header with "Заказы" title + "Обновить" button.  
Responsive table (scrollable on mobile). Each row: date, address, items summary, total, payment badge.

### Menu page
Grid of menu item cards. Each card: thumbnail, name, category chip, price, badge.  
Actions per card: **Редактировать** · **Скрыть/Показать** · **Удалить** (with confirmation).  
"+ Добавить пункт" button opens `/admin/menu/new`.

### Menu edit form (`/admin/menu/[id]` and `/admin/menu/new`)
Fields: Name · Category (select) · Ingredients · Size label · Price · Image URL · Badge (select, optional) · imgScale (number, optional) · Feature (checkbox) · Hidden (checkbox).  
Save button → PATCH (or POST for new) → redirect back to `/admin/menu`.

---

## Security

- Admin routes under `/admin/*` are protected by `app/admin/layout.tsx` (server-side redirect).
- Admin API routes under `/api/admin/*` each independently call `verifyAdminSession` — no security by obscurity.
- `ADMIN_PASSWORD` never logged or exposed in responses.
- Menu write operations are admin-only (server verifies `admin_session` on every mutating request).
- `data/menu.json` is NOT served statically — only read/written server-side by `lib/menu-data.ts`.

---

## Environment Variables

Add to `.env.local`:
```
ADMIN_PASSWORD=replace_with_strong_password
```

---

## Out of Scope

- Order status changes (not requested)
- Multiple admin accounts (not requested)
- Image upload (URL input only — images hosted externally)
- Real-time order notifications in admin (Telegram already handles this)
- Vercel deployment (JSON file writes require a persistent filesystem / VPS)
