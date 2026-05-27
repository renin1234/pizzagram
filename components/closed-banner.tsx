"use client";

import { useState, useEffect } from "react";
import { shopStatus } from "@/lib/utils";

export default function ClosedBanner() {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const check = () => setClosed(!shopStatus().open);
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, []);

  if (!closed) return null;

  return (
    <div className="w-full bg-ink text-cream text-center py-2.5 px-4 font-display uppercase tracking-widest text-sm border-b-2 border-crimson">
      Кухня закрыта — заказы принимаем с 11:00 до 21:45
    </div>
  );
}
