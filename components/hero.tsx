import Image from "next/image";
import { Flame, ArrowRight } from "lucide-react";
import HeroParallax from "./hero-parallax";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b-2 border-ink">
      {/* Фоновый «№01» с параллакс-эффектом глубины при скролле */}
      <HeroParallax />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 pt-10 lg:pt-16 pb-14 lg:pb-20 relative z-10">
        <div className="grid grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* LEFT — HEADLINE */}
          <div className="col-span-12 lg:col-span-6 relative">
            <div className="flex items-center gap-3 mb-6 animate-rise" style={{ animationDelay: "60ms" }}>
              <span className="eyebrow">№ 01 — Меню 2026</span>
              <span className="h-px flex-1 bg-ink/30 max-w-[180px]" />
              <span className="eyebrow text-crimson">Краснодар</span>
            </div>

            <h1 className="display text-[clamp(60px,11vw,180px)] animate-rise" style={{ animationDelay: "120ms" }}>
              <span className="block">Честная</span>
              <span className="block">
                <span className="text-crimson">пицца</span><span className="text-ink/30">.</span>
              </span>
              <span className="block">
                Без <span className="quote font-normal italic text-ink/80 -tracking-normal">понтов</span>.
              </span>
            </h1>

            <div className="mt-8 max-w-xl flex items-start gap-5 animate-rise" style={{ animationDelay: "260ms" }}>
              <div className="hidden sm:block w-1.5 self-stretch bg-crimson mt-1" />
              <p className="quote text-[18px] leading-relaxed text-ink/85">
                Мы лепим тесто руками с 11 утра. Печём в раскалённой печи 3–4 минуты.
                Отдаём с пылу-с-жару — курьерам, гостям и людям, которые забегают по дороге домой.
Краснодар, ЖК «Светлоград», Красных Партизан 1/4 к.8. Открылись в 2025.
              </p>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-3 sm:gap-4 animate-rise" style={{ animationDelay: "360ms" }}>
              <a href="#menu" className="btn-primary text-[15px] sm:text-base">
                <Flame className="w-4 h-4" /> Заказать пиццу
                <ArrowRight className="w-4 h-4 -mr-1" />
              </a>
              <a href="#menu" className="btn-secondary text-[15px] sm:text-base">
                Смотреть меню
              </a>

              <div className="hidden md:flex items-center gap-3 ml-2 pl-5 border-l-2 border-ink/30">
                <div>
                  <div className="font-display text-3xl leading-none">250 ₽</div>
                  <div className="text-[11px] uppercase tracking-widest mt-1 text-smoke">стартовая цена</div>
                </div>
              </div>
            </div>

            {/* small stats row */}
            <div className="mt-10 grid grid-cols-3 max-w-lg dotline-wrap animate-rise" style={{ animationDelay: "460ms" }}>
              <Stat big="60" small="минут — среднее время доставки" />
              <Stat big="28" small="видов пиццы каждый день" />
              <Stat big="5.0" small="★ на Яндекс.Картах · 72 отзыва" />
            </div>
          </div>

          {/* RIGHT — PIZZA VISUAL */}
          <div className="hidden lg:flex lg:col-span-6 relative lg:self-center lg:justify-end">
            <div className="relative aspect-square w-full max-w-[320px] sm:max-w-[500px] lg:max-w-[680px] lg:-mr-44">
              {/* slowly rotating ring with caption */}
              <svg
                viewBox="0 0 200 200"
                className="absolute inset-0 w-full h-full animate-spin360"
                aria-hidden
              >
                <defs>
                  <path
                    id="ring"
                    d="M100,100 m-92,0 a92,92 0 1,1 184,0 a92,92 0 1,1 -184,0"
                  />
                </defs>
                <text
                  className="font-display"
                  fill="currentColor"
                  fontSize="9"
                >
                  <textPath href="#ring">
                    {"PIZZAGRAM · KRASNODAR · С 2025 · TESTO · FUOCO · FORNO · AMORE · PIZZAGRAM · KRASNODAR · С 2025 · TESTO · FUOCO · FORNO · AMORE · "}
                  </textPath>
                </text>
              </svg>

              {/* Brand mark inside the circle */}
              <div className="absolute inset-[12%] rounded-full overflow-hidden border-2 border-ink shadow-[8px_8px_0_var(--ink)] bg-ink flex items-center justify-center">
                <Image
                  src="/logo-mark.png"
                  alt="Pizzagram"
                  width={600}
                  height={600}
                  priority
                  sizes="(min-width: 1024px) 40vw, 80vw"
                  className="w-[80%] h-[80%] object-contain"
                />
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Decorative bottom dotline */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="dotline" />
      </div>
    </section>
  );
}

function Stat({ big, small }: { big: string; small: string }) {
  return (
    <div className="pr-3">
      <div className="font-display text-3xl sm:text-5xl leading-none">{big}</div>
      <div className="mt-1.5 text-[10px] sm:text-[11px] uppercase tracking-widest text-smoke leading-snug">
        {small}
      </div>
    </div>
  );
}
