import Image from "next/image";
import { Star, Phone } from "lucide-react";

// Фото из галереи Яндекс.Карт — файлы лежат в public/gallery/ (см. README там).
const FEED: string[] = [];

const ORG_ID = "181221150144";

export default function Reviews() {
  return (
    <section id="reviews" className="relative border-b-2 border-ink overflow-hidden">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-16 lg:py-24">
        {/* Section head */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="eyebrow text-crimson">05 — Отзывы Яндекс.Карты</div>
            <h2 className="display text-[clamp(44px,7vw,100px)] mt-3">
              Не <span className="quote font-normal italic text-ink/80">мы</span>{" "}
              сказали — <br />
              <span className="text-crimson">гости.</span>
            </h2>
            <p className="quote text-lg text-ink/80 mt-4 max-w-md">
              Лента ниже подключена напрямую к Яндекс.Картам — это не редактируемые
              цитаты, а реальные отзывы наших гостей. Обновляется в реальном времени.
            </p>
          </div>

          {/* Rating badge */}
          <div className="self-start lg:self-end border-2 border-ink bg-cream shadow-[8px_8px_0_var(--ink)] flex">
            <div className="bg-ink text-cream p-5 flex flex-col items-center justify-center min-w-[120px]">
              <div className="font-display text-6xl leading-none">5.0</div>
              <div className="flex gap-0.5 mt-2 text-crimson">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
            </div>
            <div className="p-5 flex flex-col justify-center">
              <div className="eyebrow text-smoke">Рейтинг</div>
              <div className="font-display text-2xl uppercase leading-tight mt-1">
                Яндекс <br /> Карты
              </div>
              <div className="text-[12px] text-smoke mt-2">72+ отзыва</div>
            </div>
          </div>
        </div>

        {/* Yandex reviews widget */}
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          <div className="col-span-12 lg:col-span-8 relative">
            <div className="border-2 border-ink bg-cream-deep p-1 shadow-[8px_8px_0_var(--crimson)]">
              <iframe
                src={`https://yandex.ru/maps-reviews-widget/${ORG_ID}?comments`}
                title="Отзывы о Pizzagram на Яндекс.Картах"
                className="block w-full bg-cream"
                style={{ height: 780, border: 0 }}
                loading="lazy"
              />
            </div>
            <a
              href={`https://yandex.ru/maps/org/pizzagram/${ORG_ID}/reviews/`}
              target="_blank"
              rel="noreferrer"
              className="absolute -top-3 -right-3 bg-cream border-2 border-ink text-ink font-display uppercase text-[11px] tracking-widest px-3 py-1.5 hover:bg-ink hover:text-cream transition-colors"
            >
              Все на Яндексе →
            </a>
          </div>

          {/* Side column — contact + social + photo strip */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
            {/* Block — связаться с нами */}
            <div className="bg-ink text-cream border-2 border-ink p-6 flex-1 flex flex-col justify-between shadow-[6px_6px_0_var(--ink)]">
              <div>
                <div className="eyebrow text-crimson">Связаться с нами</div>
                <h3 className="font-display text-3xl uppercase leading-tight mt-3">
                  Заказ и <br />
                  <span className="text-crimson">вопросы</span>
                </h3>
                <p className="quote text-cream/70 text-sm mt-4">
                  Принимаем заказы по телефону, в WhatsApp, Telegram или MAX —
                  отвечаем ежедневно с 11:00 до 22:00.
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <a
                  href="tel:+79298358881"
                  className="btn-primary justify-center !gap-2.5"
                >
                  <Phone className="w-4 h-4" />
                  +7 929 835-88-81
                </a>
                <ReviewBtn
                  href="https://wa.me/79298358881"
                  icon="/icon-whatsapp.png"
                  label="WhatsApp"
                />
                <ReviewBtn href="https://t.me/+79298358881" icon="/icon-telegram.png" label="Telegram" />
                <ReviewBtn href="https://max.ru/c/-72923036747134/AZ3kGTqwKDY" icon="/icon-max.png" label="MAX" />
              </div>
            </div>

            {/* Block — соцсети */}
            <div className="bg-cream border-2 border-ink p-6 shadow-[6px_6px_0_var(--crimson)]">
              <div className="eyebrow text-crimson">Соцсети</div>
              <p className="quote text-ink/70 text-sm mt-2">
                Фото из печи, новинки меню и акции дня — заглядывайте.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <ReviewBtn
                  href="https://www.instagram.com/pizzagram_krd"
                  icon="/icon-instagram.png"
                  label="Instagram"
                />
                <ReviewBtn
                  href="https://t.me/pizzagram_krd"
                  icon="/icon-telegram.png"
                  label="Канал @pizzagram_krd"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {FEED.map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-square border-2 border-ink overflow-hidden bg-cream-deep group"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 12vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewBtn({
  href,
  icon,
  label,
  primary = false,
}: {
  href: string;
  icon: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={
        (primary ? "btn-primary" : "btn-secondary !bg-cream !text-ink") +
        " justify-center !gap-2.5 !pl-2"
      }
    >
      <Image src={icon} alt="" width={48} height={48} className="w-6 h-6 rounded-[6px]" />
      {label}
    </a>
  );
}
