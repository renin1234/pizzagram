"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { formatRub } from "@/lib/utils";

type OrderUser = { phone: string; name: string | null } | null;

type OrderLine = {
  name: string;
  sizeLabel: string;
  qty: number;
  price: number;
};

type Order = {
  id: string;
  lines: OrderLine[];
  total: number;
  address: string | null;
  payment: string;
  created_at: string;
  users: OrderUser;
};

const PAYMENT_LABEL: Record<string, string> = {
  cash: "Наличными",
  card_courier: "Картой",
  online: "Онлайн",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/orders");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display uppercase text-4xl">Заказы</h1>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-2 font-display uppercase text-[11px] tracking-wider px-4 py-2 border-2 border-ink hover:bg-ink hover:text-cream transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Обновить
        </button>
      </div>

      {error && <p className="text-crimson mb-4 font-body">{error}</p>}
      {loading && <p className="text-ink/50 font-body">Загрузка...</p>}

      {!loading && orders.length === 0 && (
        <p className="text-ink/50 font-body">Заказов в базе нет (гостевые заказы идут только в Telegram)</p>
      )}

      {!loading && orders.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-ink">
                {["Дата", "Клиент", "Адрес", "Состав", "Сумма", "Оплата"].map((h) => (
                  <th
                    key={h}
                    className="font-display uppercase text-[10px] tracking-widest text-left py-3 pr-4 last:pr-0"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-ink/10 hover:bg-cream-deep transition-colors align-top"
                >
                  <td className="py-3 pr-4 whitespace-nowrap text-ink/60 font-body text-xs">
                    {new Date(order.created_at).toLocaleString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  <td className="py-3 pr-4">
                    <div className="font-medium">{order.users?.phone ?? "—"}</div>
                    {order.users?.name && (
                      <div className="text-ink/50 text-xs">{order.users.name}</div>
                    )}
                  </td>

                  <td className="py-3 pr-4 max-w-[160px]">
                    <span className="text-ink/70 text-xs">{order.address ?? "Самовывоз"}</span>
                  </td>

                  <td className="py-3 pr-4 max-w-[200px]">
                    {(order.lines ?? []).map((l, i) => (
                      <div key={i} className="text-ink/80 text-xs">
                        {l.name} × {l.qty}
                      </div>
                    ))}
                  </td>

                  <td className="py-3 pr-4 text-right font-display font-bold whitespace-nowrap">
                    {formatRub(order.total)}
                  </td>

                  <td className="py-3">
                    <span className="font-display uppercase text-[9px] tracking-widest border border-ink px-2 py-0.5 whitespace-nowrap">
                      {PAYMENT_LABEL[order.payment] ?? order.payment}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
