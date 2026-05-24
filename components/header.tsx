"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Phone, MapPin } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { cn, formatRub } from "@/lib/utils";

const NAV = [
  { href: "#menu", label: "Меню" },
  { href: "#delivery", label: "Доставка" },
  { href: "#about", label: "О нас" },
  { href: "#reviews", label: "Отзывы" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [shake, setShake] = useState(false);
  const count = useCart((s) => s.totalCount());
  const total = useCart((s) => s.totalPrice());
  const pulse = useCart((s) => s.pulse);
  const openDrawer = useCart((s) => s.openDrawer);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (pulse === 0) return;
    // Триггер анимации тряски при изменении счётчика добавлений в корзину.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShake(true);
    const t = setTimeout(() => setShake(false), 420);
    return () => clearTimeout(t);
  }, [pulse]);

  return (
    <header className="sticky top-0 z-40">
      {/* Top utility strip */}
      <div className="bg-ink text-cream text-xs">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 flex items-center justify-between h-9">
          <div className="flex items-center gap-5">
            <span className="hidden sm:inline-flex items-center gap-1.5 opacity-80">
              <MapPin className="w-3.5 h-3.5" />
              ул. Красных Партизан, 1/4 к.8 · Краснодар
            </span>
            <span className="inline-flex items-center gap-1.5 opacity-80">
              Ежедневно 11:00 — 22:00
            </span>
          </div>
          <a href="tel:+79298358881" className="inline-flex items-center gap-1.5 hover:text-crimson transition-colors">
            <Phone className="w-3.5 h-3.5" />
            +7 (929) 835-88-81
          </a>
        </div>
      </div>

      {/* Main bar */}
      <div className={cn(
        "bg-cream/90 backdrop-blur transition-shadow border-b-2 border-ink",
        scrolled && "shadow-[0_6px_0_-3px_var(--ink)]"
      )}>
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group" aria-label="Pizzagram — на главную">
            <Image
              src="/logo-wordmark.png"
              alt="Pizzagram"
              width={400}
              height={180}
              priority
              className="h-10 sm:h-11 w-auto"
            />
            <span className="hidden sm:inline-block text-[10px] uppercase tracking-[0.2em] border border-ink px-1.5 py-0.5">
              Краснодар · с 2025
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-7 font-display uppercase text-[15px] tracking-wide">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="relative hover:text-crimson transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 hover:after:w-full after:bg-crimson after:transition-all"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <button
            onClick={openDrawer}
            aria-label="Открыть корзину"
            className="relative inline-flex items-center gap-2 border-2 border-ink bg-cream hover:bg-ink hover:text-cream transition-colors px-3 h-10 font-display uppercase tracking-wider"
          >
            <ShoppingBag className={cn("w-4 h-4", shake && "cart-shake")} />
            <span className="hidden sm:inline">Корзина</span>
            <span
              className={cn(
                "inline-flex items-center justify-center text-[11px] min-w-[20px] h-[20px] px-1 rounded-full font-bold transition-all",
                count > 0 ? "bg-crimson text-cream" : "bg-cream-deep text-ink"
              )}
            >
              {count}
            </span>
            {/* Живая сумма корзины — обновляется реактивно вместе со счётчиком */}
            {count > 0 && (
              <span className="hidden sm:inline text-[13px] tabular-nums">
                {formatRub(total)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Marquee strip */}
      <Marquee />
    </header>
  );
}

function Marquee() {
  const item = (i: number) => (
    <span key={i} className="inline-flex items-center gap-6 font-display uppercase tracking-wider text-[15px] py-2.5 px-6 whitespace-nowrap">
      <span>Пицца от 250 ₽</span>
      <Star />
      <span>Быстрая доставка</span>
      <Star />
      <span>Тесто на закваске</span>
      <Star />
      <span>Самовывоз без очереди</span>
      <Star />
      <span>Открыты до 22:00</span>
      <Star />
      <span>Краснодар · с 2025</span>
      <Star />
    </span>
  );

  return (
    <div className="bg-crimson text-cream border-b-2 border-ink overflow-hidden">
      <div className="marquee-track animate-marquee">
        {[0, 1, 2, 3].map(item)}
      </div>
    </div>
  );
}

function Star() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5l3 8.5 9 .5-7 5.5 2.5 9L12 18l-7.5 6 2.5-9-7-5.5 9-.5z" />
    </svg>
  );
}
