"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { MenuItem } from "@/lib/menu";

type FormState = {
  id: string;
  name: string;
  category: "pizza" | "snacks" | "drinks";
  ingredients: string;
  sizeLabel: string;
  sizePrice: string;
  image: string;
  badge: string;
  imgScale: string;
  feature: boolean;
  hidden: boolean;
};

const EMPTY: FormState = {
  id: "",
  name: "",
  category: "pizza",
  ingredients: "",
  sizeLabel: "32 см",
  sizePrice: "",
  image: "",
  badge: "",
  imgScale: "1.4",
  feature: false,
  hidden: false,
};

function itemToForm(item: MenuItem): FormState {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    ingredients: item.ingredients,
    sizeLabel: item.sizes[0]?.label ?? "32 см",
    sizePrice: String(item.sizes[0]?.price ?? ""),
    image: item.image,
    badge: item.badge ?? "",
    imgScale: String(item.imgScale ?? 1.4),
    feature: item.feature ?? false,
    hidden: item.hidden ?? false,
  };
}

function formToItem(form: FormState): MenuItem {
  return {
    id: form.id,
    name: form.name,
    category: form.category,
    ingredients: form.ingredients,
    sizes: [{ label: form.sizeLabel, price: Number(form.sizePrice) }],
    image: form.image,
    badge: form.badge as MenuItem["badge"], // "" when clearing — server will delete the key
    imgScale: form.imgScale ? Number(form.imgScale) : undefined,
    feature: form.feature || undefined,
    hidden: form.hidden || undefined,
  };
}

export default function AdminMenuItemPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const isNew = id === "new";
  const router = useRouter();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isNew) return;
    fetch(`/api/admin/menu/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.item) setForm(itemToForm(d.item as MenuItem));
        else setError("Пункт не найден");
      })
      .catch(() => setError("Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const body = formToItem(form);
      const res = isNew
        ? await fetch("/api/admin/menu", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch(`/api/admin/menu/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (res.ok) {
        router.push("/admin/menu");
      } else {
        const data = await res.json();
        setError(data.error ?? "Ошибка сохранения");
      }
    } catch {
      setError("Нет соединения с сервером");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-2xl px-4 py-8"><p className="text-ink/50">Загрузка...</p></main>;

  const inputClass =
    "w-full border-2 border-ink bg-white px-4 py-3 font-body text-base focus:outline-none focus:border-crimson";
  const labelClass =
    "font-display uppercase text-[11px] tracking-widest text-smoke block mb-1.5";

  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <Link
        href="/admin/menu"
        className="inline-flex items-center gap-2 font-display uppercase tracking-wider text-sm hover:text-crimson transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> К списку
      </Link>

      <h1 className="font-display uppercase text-4xl mb-8">
        {isNew ? "Новый пункт" : "Редактировать"}
      </h1>

      <form onSubmit={handleSubmit} className="border-2 border-ink bg-cream shadow-[6px_6px_0_var(--ink)] p-6 sm:p-8 space-y-5">
        {/* ID (only for new) */}
        {isNew && (
          <div>
            <label className={labelClass}>ID (slug, латиница)</label>
            <input
              type="text"
              value={form.id}
              onChange={(e) => set("id", e.target.value)}
              required
              placeholder="pizza-margherita"
              className={inputClass}
            />
          </div>
        )}

        {/* Name */}
        <div>
          <label className={labelClass}>Название</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            placeholder="Маргарита"
            className={inputClass}
          />
        </div>

        {/* Category */}
        <div>
          <label className={labelClass}>Категория</label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value as FormState["category"])}
            className={inputClass}
          >
            <option value="pizza">Пицца</option>
            <option value="snacks">Закуски</option>
            <option value="drinks">Напитки</option>
          </select>
        </div>

        {/* Ingredients */}
        <div>
          <label className={labelClass}>Состав / описание</label>
          <input
            type="text"
            value={form.ingredients}
            onChange={(e) => set("ingredients", e.target.value)}
            placeholder="Моцарелла, томатный соус, базилик"
            className={inputClass}
          />
        </div>

        {/* Size */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Размер</label>
            <input
              type="text"
              value={form.sizeLabel}
              onChange={(e) => set("sizeLabel", e.target.value)}
              placeholder="32 см"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Цена, ₽</label>
            <input
              type="number"
              value={form.sizePrice}
              onChange={(e) => set("sizePrice", e.target.value)}
              required
              min={1}
              placeholder="350"
              className={inputClass}
            />
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label className={labelClass}>URL изображения</label>
          <input
            type="url"
            value={form.image}
            onChange={(e) => set("image", e.target.value)}
            required
            placeholder="https://..."
            className={inputClass}
          />
          {form.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.image} alt="" className="mt-2 w-24 h-24 object-cover border border-ink/20" />
          )}
        </div>

        {/* Badge */}
        <div>
          <label className={labelClass}>Бейдж (опционально)</label>
          <select
            value={form.badge}
            onChange={(e) => set("badge", e.target.value)}
            className={inputClass}
          >
            <option value="">— без бейджа —</option>
            <option value="ХИТ">ХИТ</option>
            <option value="НОВОЕ">НОВОЕ</option>
            <option value="ВЕГ">ВЕГ</option>
            <option value="ОСТРОЕ">ОСТРОЕ</option>
            <option value="−20%">−20%</option>
          </select>
        </div>

        {/* imgScale */}
        <div>
          <label className={labelClass}>Масштаб фото (imgScale, по умолчанию 1.4)</label>
          <input
            type="number"
            value={form.imgScale}
            onChange={(e) => set("imgScale", e.target.value)}
            step="0.05"
            min={0.5}
            max={3}
            placeholder="1.4"
            className={inputClass}
          />
        </div>

        {/* Checkboxes */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.feature}
              onChange={(e) => set("feature", e.target.checked)}
              className="w-4 h-4 border-2 border-ink"
            />
            <span className="font-display uppercase text-[11px] tracking-widest">
              Рекомендуем (feature)
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.hidden}
              onChange={(e) => set("hidden", e.target.checked)}
              className="w-4 h-4 border-2 border-ink"
            />
            <span className="font-display uppercase text-[11px] tracking-widest text-crimson">
              Скрыть с сайта
            </span>
          </label>
        </div>

        {error && <p className="text-crimson text-sm font-body">{error}</p>}

        {/* Submit */}
        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="font-display uppercase tracking-wider px-6 py-3 border-2 border-ink bg-crimson text-cream hover:bg-ink transition-colors disabled:opacity-60"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
          <Link
            href="/admin/menu"
            className="font-display uppercase tracking-wider px-6 py-3 border-2 border-ink hover:bg-ink hover:text-cream transition-colors"
          >
            Отмена
          </Link>
        </div>
      </form>
    </main>
  );
}
