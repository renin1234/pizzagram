"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/admin/orders");
      } else {
        const data = await res.json();
        setError(data.error ?? "Ошибка входа");
      }
    } catch {
      setError("Нет соединения с сервером");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm border-4 border-ink bg-cream shadow-[8px_8px_0_var(--ink)] p-8">
        <div className="font-display uppercase tracking-widest text-[11px] text-smoke mb-2">
          Pizzagram
        </div>
        <h1 className="font-display uppercase text-3xl mb-8 leading-tight">
          Панель<br />управления
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-display uppercase text-[11px] tracking-widest text-smoke block mb-1.5">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              className="w-full border-2 border-ink bg-white px-4 py-3 font-body text-base focus:outline-none focus:border-crimson"
            />
          </div>

          {error && (
            <p className="text-crimson text-sm font-body">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-display uppercase tracking-wider px-6 py-3 border-2 border-ink bg-crimson text-cream hover:bg-ink transition-colors disabled:opacity-60"
          >
            {loading ? "Вход..." : "Войти →"}
          </button>
        </form>
      </div>
    </main>
  );
}
