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

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setAddress(user.address ?? "");
    }
  }, [user]);

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