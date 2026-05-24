import Link from "next/link";
import Image from "next/image";
import { Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-ink text-cream relative">
      {/* Marquee at top */}
      <div className="overflow-hidden border-b-2 border-cream/10">
        <div className="marquee-track animate-marquee py-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="font-display uppercase text-[64px] sm:text-[96px] leading-none px-8 whitespace-nowrap tracking-tight"
            >
              PIZZAGRAM
              <span className="inline-block w-4 h-4 bg-crimson mx-6 align-middle" />
              КРАСНОДАР
              <span className="inline-block w-4 h-4 bg-cream mx-6 align-middle" />
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6">
          {/* Brand col */}
          <div className="col-span-2 lg:col-span-4">
            <Image
              src="/logo-wordmark.png"
              alt="Pizzagram"
              width={520}
              height={234}
              className="h-16 sm:h-20 w-auto"
            />
            <p className="quote text-cream/70 mt-4 max-w-sm">
              Локальная пиццерия в Краснодаре. С 2025 года делаем
              честное тесто и понятную пиццу. Без понтов.
            </p>
          </div>

          {/* Контакты */}
          <div className="col-span-1 lg:col-span-3">
            <div className="eyebrow text-crimson">Контакты</div>
            <ul className="mt-4 space-y-3 text-[15px]">
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-1 shrink-0" />
                <a href="tel:+79298358881" className="hover:text-crimson">
                  +7 (929) 835-88-81
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 shrink-0" />
                <span>ул. Красных Партизан, 1/4 к.8<br />ЖК Светлоград · Краснодар</span>
              </li>
              <li className="text-cream/60 text-sm">
                Ежедневно 11:00 — 22:00
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <SocialIcon
                href="https://wa.me/79298358881"
                icon="/icon-whatsapp.png"
                label="Написать в WhatsApp"
              />
              <SocialIcon
                href="https://t.me/+79298358881"
                icon="/icon-telegram.png"
                label="Написать в Telegram"
              />
              <SocialIcon
                href="https://max.ru/c/-72923036747134/AZ3kGTqwKDY"
                icon="/icon-max.png"
                label="Чат в MAX"
              />
            </div>
          </div>

          {/* Соцсети */}
          <div className="col-span-1 lg:col-span-2">
            <div className="eyebrow text-crimson">Соцсети</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <SocialIcon
                href="https://www.instagram.com/pizzagram_krd"
                icon="/icon-instagram.png"
                label="Instagram @pizzagram_krd"
              />
              <SocialIcon
                href="https://t.me/pizzagram_krd"
                icon="/icon-telegram.png"
                label="Telegram-канал @pizzagram_krd"
              />
            </div>
          </div>

          {/* Меню */}
          <div className="col-span-2 lg:col-span-3">
            <div className="eyebrow text-crimson">Меню</div>
            <ul className="mt-4 space-y-2 text-[15px]">
              <li><Link href="#menu" className="hover:text-crimson">Пицца</Link></li>
              <li><Link href="#menu" className="hover:text-crimson">Закуски</Link></li>
              <li><Link href="#menu" className="hover:text-crimson">Напитки</Link></li>
              <li><Link href="#delivery" className="hover:text-crimson">Доставка и самовывоз</Link></li>
              <li><Link href="#reviews" className="hover:text-crimson">Отзывы Яндекс.Карты</Link></li>
            </ul>
          </div>
        </div>

        <div className="dotline mt-12 opacity-40" />

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
            <Link href="/policy" className="py-1 text-cream/60 hover:text-crimson">
              Политика конфиденциальности
            </Link>
            <Link href="/oferta" className="py-1 text-cream/60 hover:text-crimson">
              Оферта
            </Link>
            <Link href="/cookies" className="py-1 text-cream/60 hover:text-crimson">
              Cookies
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-cream/50">
            <div>
              © {new Date().getFullYear()} ИП Ноздрачев И. Е. · ИНН 263213954032 · ОГРНИП 325265100126742
            </div>
            <div>
              Сделано в Краснодаре · с любовью к тесту
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="group relative w-10 h-10 rounded-[10px] overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 will-change-transform"
    >
      <Image
        src={icon}
        alt=""
        width={80}
        height={80}
        className="w-full h-full object-cover"
      />
      <span className="absolute inset-0 bg-crimson opacity-0 group-hover:opacity-75 transition-opacity duration-200 rounded-[10px]" />
    </a>
  );
}
