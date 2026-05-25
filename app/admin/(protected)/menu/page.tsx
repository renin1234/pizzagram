"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Pencil, Eye, EyeOff, Trash2 } from "lucide-react";
import type { MenuItem } from "@/lib/menu";

const BADGE_COLORS: Record<string, string> = {
  "ХИТ": "bg-crimson text-cream",
  "НОВОЕ": "bg-ink text-cream",
  "ВЕГ": "bg-green-600 text-white",
  "ОСТРОЕ": "bg-orange-500 text-white",
  "−20%": "bg-yellow-400 text-ink",
};

const CATEGORY_LABEL: Record<string, string> = {
  pizza: "Пицца",
  snacks: "Закуски",
  drinks: "Напитки",
};

export default function AdminMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/menu");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  async function toggleHidden(item: MenuItem) {
    await fetch(`/api/admin/menu/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hidden: !item.hidden }),
    });
    fetchMenu();
  }

  async function handleDelete(item: MenuItem) {
    if (!window.confirm(`Удалить «${item.name}»? Это действие нельзя отменить.`)) return;
    await fetch(`/api/admin/menu/${item.id}`, { method: "DELETE" });
    fetchMenu();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display uppercase text-4xl">Меню</h1>
        <Link
          href="/admin/menu/new"
          className="flex items-center gap-2 font-display uppercase text-[11px] tracking-wider px-4 py-2 border-2 border-ink bg-crimson text-cream hover:bg-ink transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Добавить
        </Link>
      </div>

      {error && <p className="text-crimson mb-4 font-body">{error}</p>}
      {loading && <p className="text-ink/50 font-body">Загрузка...</p>}

      {!loading && items.length > 0 && (
        <div className="grid gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 border-2 border-ink p-3 transition-colors ${
                item.hidden ? "opacity-50 bg-cream-deep" : "bg-cream"
              }`}
            >
              {/* Thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.name}
                className="w-14 h-14 object-cover shrink-0 border border-ink/20"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display uppercase text-sm font-bold leading-tight">
                    {item.name}
                  </span>
                  {item.badge && (
                    <span
                      className={`font-display uppercase text-[9px] tracking-widest px-1.5 py-0.5 ${
                        BADGE_COLORS[item.badge] ?? "bg-ink/10 text-ink"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.hidden && (
                    <span className="font-display uppercase text-[9px] tracking-widest px-1.5 py-0.5 border border-ink/30 text-ink/40">
                      Скрыт
                    </span>
                  )}
                </div>
                <div className="text-xs text-ink/50 mt-0.5">
                  {CATEGORY_LABEL[item.category] ?? item.category} ·{" "}
                  {item.sizes.map((s) => `${s.label} — ${s.price} ₽`).join(", ")}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  href={`/admin/menu/${item.id}`}
                  className="p-2 border border-ink/20 hover:border-ink hover:bg-ink/5 transition-colors"
                  title="Редактировать"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => toggleHidden(item)}
                  className="p-2 border border-ink/20 hover:border-ink hover:bg-ink/5 transition-colors"
                  title={item.hidden ? "Показать на сайте" : "Скрыть с сайта"}
                >
                  {item.hidden ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 border border-ink/20 hover:border-crimson hover:bg-crimson/5 transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
