"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const STORAGE_KEY = "pizzagram-cookies-v1";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      // localStorage есть только на клиенте — читаем его в эффекте после монтирования.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch {}
  }, []);

  const accept = (value: "all" | "necessary") => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice: value, ts: Date.now() }),
      );
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed left-3 right-3 lg:left-auto lg:right-6 bottom-3 lg:bottom-6 z-50 max-w-[440px] lg:ml-auto">
      <div className="relative bg-cream border-2 border-ink p-5 shadow-[8px_8px_0_var(--ink)]">
        <button
          onClick={() => accept("necessary")}
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center hover:bg-ink hover:text-cream transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <span className="font-display text-3xl leading-none mt-1">🍪</span>
          <div>
            <div className="font-display uppercase tracking-wider text-base leading-tight">
              Используем cookies
            </div>
            <p className="quote text-[13px] text-ink/75 mt-2 leading-relaxed">
              Чтобы сайт корректно работал и мы могли запоминать вашу корзину.
              Подробнее — в{" "}
              <Link href="/cookies" className="underline hover:text-crimson">
                политике cookies
              </Link>{" "}
              и{" "}
              <Link href="/oferta" className="underline hover:text-crimson">
                оферте
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button onClick={() => accept("all")} className="btn-primary justify-center flex-1 !py-2.5 !text-sm">
            Принять все
          </button>
          <button onClick={() => accept("necessary")} className="btn-secondary justify-center flex-1 !py-2.5 !text-sm">
            Только нужные
          </button>
        </div>
      </div>
    </div>
  );
}
