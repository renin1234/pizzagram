"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import type { Extra } from "@/lib/extras";

type ExtrasFile = { extras: Extra[]; sauces: Extra[] };

export default function AdminExtrasPage() {
  const [data, setData] = useState<ExtrasFile>({ extras: [], sauces: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/extras");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <h1 className="font-display uppercase text-4xl mb-8">Добавки и соусы</h1>

      {error && <p className="text-crimson mb-4 font-body">{error}</p>}
      {loading && <p className="text-ink/50 font-body">Загрузка...</p>}

      {!loading && (
        <div className="space-y-12">
          <ExtrasSection
            title="Добавки к пицце"
            type="extras"
            items={data.extras}
            onRefresh={fetchData}
            onError={setError}
          />
          <ExtrasSection
            title="Соусы к закускам"
            subtitle="ID соуса должен начинаться с sauce-"
            type="sauces"
            items={data.sauces}
            defaultIdPrefix="sauce-"
            onRefresh={fetchData}
            onError={setError}
          />
        </div>
      )}
    </main>
  );
}

function ExtrasSection({
  title,
  subtitle,
  type,
  items,
  defaultIdPrefix = "",
  onRefresh,
  onError,
}: {
  title: string;
  subtitle?: string;
  type: "extras" | "sauces";
  items: Extra[];
  defaultIdPrefix?: string;
  onRefresh: () => void;
  onError: (msg: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [addName, setAddName] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = (item: Extra) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(String(item.price));
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    const price = parseInt(editPrice, 10);
    if (!editName.trim() || isNaN(price) || price < 0) {
      onError("Укажите название и корректную цену");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/extras/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, patch: { name: editName.trim(), price } }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      setEditingId(null);
      onRefresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: Extra) => {
    if (!window.confirm(`Удалить «${item.name}»?`)) return;
    try {
      const res = await fetch(`/api/admin/extras/${item.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      onRefresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Ошибка удаления");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseInt(addPrice, 10);
    if (!addName.trim() || isNaN(price) || price < 0) {
      onError("Укажите название и цену");
      return;
    }
    const id = `${defaultIdPrefix}${Date.now()}`;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/extras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, item: { id, name: addName.trim(), price } }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      setAddName("");
      setAddPrice("");
      onRefresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Ошибка добавления");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="mb-4">
        <h2 className="font-display uppercase text-2xl">{title}</h2>
        {subtitle && <p className="text-[12px] text-smoke mt-0.5">{subtitle}</p>}
      </div>

      <div className="grid gap-2">
        {items.map((item) =>
          editingId === item.id ? (
            <div key={item.id} className="flex items-center gap-2 border-2 border-crimson bg-cream p-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input flex-1 !py-1.5 text-sm"
                placeholder="Название"
                autoFocus
              />
              <div className="flex items-center gap-1 shrink-0">
                <input
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="input w-20 !py-1.5 text-sm text-right"
                  placeholder="₽"
                  type="number"
                  min="0"
                />
                <span className="text-sm text-smoke shrink-0">₽</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => saveEdit(item.id)}
                  disabled={saving}
                  className="p-2 border border-ink/20 hover:border-ink hover:bg-ink/5 transition-colors disabled:opacity-50"
                  title="Сохранить"
                >
                  <Check className="w-3.5 h-3.5 text-crimson" />
                </button>
                <button
                  onClick={cancelEdit}
                  className="p-2 border border-ink/20 hover:border-ink hover:bg-ink/5 transition-colors"
                  title="Отмена"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div key={item.id} className="flex items-center gap-3 border-2 border-ink bg-cream p-3">
              <div className="flex-1 min-w-0">
                <span className="font-display uppercase text-sm">{item.name}</span>
                <span className="text-xs text-smoke ml-2">{item.price} ₽</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => startEdit(item)}
                  className="p-2 border border-ink/20 hover:border-ink hover:bg-ink/5 transition-colors"
                  title="Редактировать"
                >
                  <Pencil className="w-3.5 h-3.5" />
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
          )
        )}
      </div>

      {/* Add new */}
      <form onSubmit={handleAdd} className="mt-3 flex items-center gap-2">
        <input
          value={addName}
          onChange={(e) => setAddName(e.target.value)}
          className="input flex-1 !py-2 text-sm"
          placeholder="Название"
        />
        <div className="flex items-center gap-1 shrink-0">
          <input
            value={addPrice}
            onChange={(e) => setAddPrice(e.target.value)}
            className="input w-20 !py-2 text-sm text-right"
            placeholder="₽"
            type="number"
            min="0"
          />
          <span className="text-sm text-smoke shrink-0">₽</span>
        </div>
        <button
          type="submit"
          disabled={saving || !addName.trim() || !addPrice}
          className="flex items-center gap-1.5 font-display uppercase text-[11px] tracking-wider px-3 py-2 border-2 border-ink bg-crimson text-cream hover:bg-ink transition-colors disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          Добавить
        </button>
      </form>
    </section>
  );
}
