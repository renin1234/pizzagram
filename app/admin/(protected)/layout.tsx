import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAdminSession } from "@/lib/admin-session";
import Link from "next/link";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (!token || !(await verifyAdminSession(token))) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Top nav */}
      <header className="border-b-4 border-ink bg-cream sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 flex items-center justify-between gap-6">
          <Link
            href="/admin/orders"
            className="font-display uppercase tracking-widest text-sm"
          >
            🍕 Admin
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/admin/orders"
              className="font-display uppercase text-[11px] tracking-wider hover:text-crimson transition-colors"
            >
              Заказы
            </Link>
            <Link
              href="/admin/menu"
              className="font-display uppercase text-[11px] tracking-wider hover:text-crimson transition-colors"
            >
              Меню
            </Link>
            <form action="/api/admin/logout" method="post">
              <button
                type="submit"
                className="font-display uppercase text-[11px] tracking-wider text-crimson hover:underline"
              >
                Выйти
              </button>
            </form>
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
