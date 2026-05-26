"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { User, ChevronDown, LogOut, X } from "lucide-react";
import { useAuth, AuthUser } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

export default function UserMenu() {
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const setUser = useAuth((s) => s.setUser);
  const logout = useAuth((s) => s.logout);
  const [open, setOpen] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        btnRef.current && !btnRef.current.contains(target)
      ) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPanelPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
  }, [open]);

  if (loading) return null;

  if (!user) {
    return (
      <>
        <button
          ref={btnRef}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={cn(
            "inline-flex items-center gap-2 border-2 border-ink px-3 h-10 font-display uppercase tracking-wider text-sm transition-colors",
            open ? "bg-ink text-cream" : "bg-cream hover:bg-ink hover:text-cream"
          )}
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Войти</span>
        </button>

        {open && createPortal(
          <div
            ref={panelRef}
            className="fixed z-[9999] w-72 border-2 border-ink shadow-[8px_8px_0_var(--ink)]"
            style={{ top: panelPos.top, right: panelPos.right, backgroundColor: "#F3E7E0" }}
          >
            <AuthPanel onSuccess={() => setOpen(false)} onClose={() => setOpen(false)} setUser={setUser} />
          </div>,
          document.body
        )}
      </>
    );
  }

  const displayName = user.name?.trim() || user.phone;

  return (
    <UserDropdown user={displayName} logout={logout} />
  );
}

function UserDropdown({ user, logout }: { user: string; logout: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-2 border-2 border-ink px-3 h-10 font-display uppercase tracking-wider text-sm transition-colors",
          open ? "bg-ink text-cream" : "bg-cream hover:bg-ink hover:text-cream"
        )}
      >
        <User className="w-4 h-4" />
        <span className="hidden sm:inline max-w-[120px] truncate">{user}</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50 w-44 bg-cream border-2 border-ink shadow-[4px_4px_0_var(--ink)]">
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-3 font-display uppercase text-sm tracking-wider hover:bg-creamdeep transition-colors border-b-2 border-ink"
          >
            <User className="w-4 h-4" /> Кабинет
          </Link>
          <button
            onClick={() => { logout(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-4 py-3 font-display uppercase text-sm tracking-wider hover:bg-crimson hover:text-cream transition-colors"
          >
            <LogOut className="w-4 h-4" /> Выйти
          </button>
        </div>
      )}
    </div>
  );
}

function AuthPanel({
  onSuccess,
  onClose,
  setUser,
}: {
  onSuccess: () => void;
  onClose: () => void;
  setUser: (u: AuthUser | null) => void;
}) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("+7");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

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
      onSuccess();
    } catch {
      setError("Нет соединения");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="eyebrow text-[11px] mb-0.5" style={{ color: "var(--crimson)" }}>
            {step === "phone" ? "Вход / Регистрация" : "Подтверждение"}
          </div>
          <h2 className="font-display uppercase text-lg leading-tight">
            {step === "phone" ? "Ваш телефон" : "Код из SMS"}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center border-2 border-ink hover:bg-crimson hover:text-cream transition-colors flex-shrink-0"
          aria-label="Закрыть"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {step === "phone" ? (
        <form onSubmit={handleSendCode} className="space-y-3">
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              const v = e.target.value;
              setPhone(v.startsWith("+7") ? v : "+7");
            }}
            placeholder="+7 (999) 123-45-67"
            required
            className="w-full border-2 border-ink bg-white px-3 py-2.5 font-body text-sm focus:outline-none focus:border-crimson"
          />
          {error && <p className="text-crimson text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-display uppercase tracking-wider py-3 text-sm border-2 border-ink bg-crimson text-cream hover:bg-ink transition-colors disabled:opacity-60"
          >
            {loading ? "Отправка..." : "Получить код"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-3">
          <p className="text-xs text-ink/60">
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
            className="w-full border-2 border-ink bg-white px-3 py-2.5 font-display text-2xl tracking-[0.5em] text-center focus:outline-none focus:border-crimson"
          />
          {error && <p className="text-crimson text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full font-display uppercase tracking-wider py-3 text-sm border-2 border-ink bg-crimson text-cream hover:bg-ink transition-colors disabled:opacity-60"
          >
            {loading ? "Проверка..." : "Войти"}
          </button>
          <button
            type="button"
            disabled={countdown > 0}
            onClick={() => { setStep("phone"); setCode(""); setError(""); }}
            className="w-full text-xs text-ink/60 hover:text-ink disabled:text-ink/30 transition-colors"
          >
            {countdown > 0 ? `Повторить через ${countdown} сек` : "← Изменить номер"}
          </button>
        </form>
      )}
    </div>
  );
}
