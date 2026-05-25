"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

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
      <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Вход в личный кабинет"
          className="relative w-full sm:max-w-sm bg-cream border-2 border-ink shadow-[0_-4px_0_var(--ink)] sm:shadow-[8px_8px_0_var(--ink)] p-6 sm:p-8"
        >
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
