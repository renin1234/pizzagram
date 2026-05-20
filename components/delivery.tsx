import Image from "next/image";
import { MapPin, Phone, Bike, ShoppingBag } from "lucide-react";
import DeliveryMap from "./delivery-map";

export default function Delivery() {
  return (
    <section id="delivery" className="relative border-b-2 border-ink bg-cream-deep">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-16 lg:py-24">
        <div className="grid grid-cols-12 gap-6 lg:gap-10">
          {/* LEFT */}
          <div className="col-span-12 lg:col-span-5">
            <div className="eyebrow text-crimson">03 — Доставка и самовывоз</div>
            <h2 className="display text-[clamp(44px,7vw,96px)] mt-3">
              Привезём <br />
              <span className="text-crimson">за 60 минут</span>
              <br />
              <span className="quote font-normal italic text-ink/80">или</span> заберите сами.
            </h2>
            <p className="quote text-lg text-ink/80 mt-5 max-w-md">
              По Краснодару — горячая, не остывшая. Никаких подводных камней.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="tel:+79298358881" className="btn-primary">
                <Phone className="w-4 h-4" />
                +7 929 835-88-81
              </a>
              <SocialBtn href="https://wa.me/79298358881" icon="/icon-whatsapp.png" label="WhatsApp" />
              <SocialBtn href="https://t.me/+79298358881" icon="/icon-telegram.png" label="Telegram" />
              <SocialBtn href="https://t.me/pizzagram_krd" icon="/icon-telegram.png" label="Канал" title="Подписаться на наш Telegram-канал" />
              <SocialBtn href="https://max.ru/c/-72923036747134/AZ3kGTqwKDY" icon="/icon-max.png" label="MAX" />
              <SocialBtn href="https://www.instagram.com/pizzagram_krd" icon="/icon-instagram.png" label="Instagram" />
            </div>
          </div>

          {/* RIGHT — two stacked tiles */}
          <div className="col-span-12 lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {/* Delivery card */}
            <div className="bg-cream border-2 border-ink p-6 shadow-[8px_8px_0_var(--ink)] relative">
              <div className="absolute -top-3 -right-3 bg-crimson border-2 border-ink text-cream font-display uppercase text-xs tracking-widest px-3 py-1">
                Доставка
              </div>
              <Bike className="w-10 h-10 mb-4" strokeWidth={1.5} />
              <h3 className="font-display text-3xl uppercase leading-tight">
                По всему <br /> городу
              </h3>
              <ul className="mt-5 space-y-3 text-[15px]">
                <Row k="Среднее время" v="55–70 минут" />
                <Row k="Стоимость" v="по зоне — расчёт ниже" />
                <Row k="Зона" v="Краснодар, ЖК Светлоград и рядом" />
                <Row k="Часы" v="11:00 — 22:00 каждый день" />
              </ul>
            </div>

            {/* Pickup card */}
            <div className="bg-ink text-cream border-2 border-ink p-6 shadow-[8px_8px_0_var(--crimson)] relative">
              <div className="absolute -top-3 -right-3 bg-cream border-2 border-ink text-ink font-display uppercase text-xs tracking-widest px-3 py-1">
                Самовывоз
              </div>
              <ShoppingBag className="w-10 h-10 mb-4 text-crimson" strokeWidth={1.5} />
              <h3 className="font-display text-3xl uppercase leading-tight">
                Заберите <br /> сами
              </h3>
              <ul className="mt-5 space-y-3 text-[15px]">
                <Row k="Адрес" v="Красных Партизан, 1/4 к.8" dark />
                <Row k="Готовность" v="20 минут после оплаты" dark />
                <Row k="Парковка" v="Двор ЖК Светлоград" dark />
                <Row k="Часы" v="11:00 — 22:00" dark />
              </ul>
            </div>
          </div>
        </div>

        {/* Калькулятор зоны доставки */}
        <div className="mt-6 lg:mt-10 border-2 border-ink bg-cream shadow-[8px_8px_0_var(--ink)]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 p-5 sm:p-7 border-b-2 border-ink">
            <div>
              <div className="flex items-center gap-2 text-crimson">
                <MapPin className="w-4 h-4" />
                <span className="eyebrow">Калькулятор доставки</span>
              </div>
              <h3 className="font-display text-3xl sm:text-4xl uppercase leading-tight mt-2">
                Узнайте стоимость <br className="hidden sm:block" />
                доставки на ваш адрес
              </h3>
            </div>
            <p className="quote text-ink/70 text-sm max-w-xs">
              Введите адрес или поставьте точку на карте — покажем зону, цену
              доставки и минимальную сумму заказа.
            </p>
          </div>
          <div className="p-5 sm:p-7">
            <DeliveryMap variant="full" />
            <a
              href="https://yandex.ru/maps/org/pizzagram/181221150144/"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-display uppercase tracking-wider hover:text-crimson"
            >
              Открыть пиццерию на Яндекс.Картах →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialBtn({ href, icon, label, title }: { href: string; icon: string; label: string; title?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={title || label}
      className="btn-secondary !gap-2.5 !pl-2"
    >
      <Image src={icon} alt="" width={48} height={48} className="w-6 h-6 rounded-[6px]" />
      {label}
    </a>
  );
}

function Row({ k, v, dark = false }: { k: string; v: string; dark?: boolean }) {
  return (
    <li className="flex items-baseline justify-between gap-4 border-b border-dashed border-current/30 pb-2">
      <span className={`font-display uppercase tracking-wider text-[11px] ${dark ? "text-cream/60" : "text-smoke"}`}>
        {k}
      </span>
      <span className="font-medium text-right">{v}</span>
    </li>
  );
}
