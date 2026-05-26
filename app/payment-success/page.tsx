"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check } from "lucide-react";

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("order");

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md border-2 border-ink bg-cream shadow-[10px_10px_0_var(--ink)] p-8 sm:p-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full border-2 border-ink bg-crimson text-cream flex items-center justify-center shadow-[4px_4px_0_var(--ink)]">
            <Check className="w-10 h-10" strokeWidth={3} />
          </div>
        </div>

        <h1 className="font-display uppercase text-4xl sm:text-5xl leading-tight mb-4">
          Оплачено!
        </h1>

        <p className="quote text-ink/70 text-base leading-relaxed mb-2">
          Ваш заказ оплачен и принят в работу. Оператор свяжется с вами в течение&nbsp;5&nbsp;минут.
        </p>

        {orderId && (
          <p className="font-display uppercase tracking-widest text-[11px] text-smoke mt-4">
            Номер заказа: {orderId}
          </p>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="font-display uppercase tracking-wider text-sm px-6 py-3 border-2 border-ink bg-crimson text-cream hover:bg-ink transition-colors"
          >
            На главную
          </Link>
          <Link
            href="/account"
            className="font-display uppercase tracking-wider text-sm px-6 py-3 border-2 border-ink bg-cream hover:bg-ink hover:text-cream transition-colors"
          >
            Мои заказы
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
