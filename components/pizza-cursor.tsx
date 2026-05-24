"use client";

import { useEffect, useRef } from "react";

/**
 * Кастомный курсор-пицца (Фича 6). Только на десктопе (точный указатель):
 * прячем системный курсор и рисуем 🍕, который следует за мышью через
 * requestAnimationFrame. По клику — анимация «уменьшения» (укуса).
 * На сенсорных устройствах не активируется.
 */
export default function PizzaCursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Только устройства с точным указателем (мышь) — тач-экраны не трогаем.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const dot = dotRef.current;
    if (!dot) return;

    document.documentElement.classList.add("pizza-cursor-on");

    let raf = 0;
    let x = -100;
    let y = -100;
    const render = () => {
      raf = 0;
      dot.style.transform = `translate(${x}px, ${y}px)`;
    };
    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(render);
    };
    const onDown = () => dot.classList.add("pizza-cursor--bite");
    const onUp = () => dot.classList.remove("pizza-cursor--bite");

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.classList.remove("pizza-cursor-on");
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={dotRef}
      aria-hidden
      className="pizza-cursor"
      style={{ transform: "translate(-100px, -100px)" }}
    >
      <span className="pizza-cursor__glyph">🍕</span>
    </div>
  );
}
