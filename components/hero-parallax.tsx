"use client";

import { useEffect, useRef } from "react";

/**
 * Фоновый декоративный «№01» в hero-секции с эффектом параллакса:
 * при скролле страницы элемент сдвигается медленнее самой страницы,
 * создавая ощущение глубины. Лёгкая реализация — requestAnimationFrame
 * + CSS transform, без сторонних библиотек.
 */
export default function HeroParallax() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Уважаем системную настройку «уменьшить движение».
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      // Фон смещается на 30% от величины скролла — медленнее страницы.
      el.style.transform = `translate3d(0, ${window.scrollY * 0.3}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute -right-6 top-2 select-none opacity-[0.06] font-display text-[260px] leading-none will-change-transform"
    >
      №01
    </div>
  );
}
