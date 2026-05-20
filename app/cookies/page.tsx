import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CartDrawer from "@/components/cart-drawer";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Cookies — PIZZAGRAM",
  description: "Какие файлы cookies использует pizzagram.ru.",
};

const ROWS = [
  {
    name: "pizzagram-cart-v1",
    purpose: "Сохраняет содержимое корзины между визитами, чтобы выбранные пиццы не сбрасывались при перезагрузке.",
    type: "Необходимый",
    storage: "localStorage",
    ttl: "Бессрочно (до очистки браузера)",
  },
  {
    name: "pizzagram-cookies-v1",
    purpose: "Запоминает ваш выбор в баннере согласия на использование cookies.",
    type: "Необходимый",
    storage: "localStorage",
    ttl: "Бессрочно",
  },
  {
    name: "ya_metrika_*",
    purpose: "Анонимная статистика посещений (Яндекс.Метрика). Помогает понять, что на сайте работает, а что — нет.",
    type: "Аналитика",
    storage: "Cookies",
    ttl: "До 24 месяцев",
  },
];

export default function CookiesPage() {
  return (
    <main>
      <Header />
      <article className="border-b-2 border-ink">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-12 lg:py-20">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-display uppercase tracking-wider hover:text-crimson mb-8">
            <ArrowLeft className="w-4 h-4" /> На главную
          </Link>
          <div className="eyebrow text-crimson">Документ № 02</div>
          <h1 className="display text-[clamp(40px,7vw,96px)] mt-3">
            Политика <br />
            <span className="text-crimson">cookies</span>
          </h1>
          <p className="quote text-lg text-ink/80 mt-5 max-w-2xl">
            Здесь честно перечислено, что pizzagram.ru хранит у вас в браузере и зачем.
            Никаких трекинга личной переписки, никаких пикселей рекламных сетей — только
            то, без чего сайт не работает, плюс анонимная статистика посещений.
          </p>

          <div className="dotline my-10" />

          <h2 className="display text-3xl uppercase mb-5">Что мы храним</h2>
          <div className="border-2 border-ink overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ink text-cream">
                <tr>
                  <th className="text-left p-3 font-display uppercase tracking-wider">Имя</th>
                  <th className="text-left p-3 font-display uppercase tracking-wider">Назначение</th>
                  <th className="text-left p-3 font-display uppercase tracking-wider">Тип</th>
                  <th className="text-left p-3 font-display uppercase tracking-wider hidden sm:table-cell">Хранение</th>
                  <th className="text-left p-3 font-display uppercase tracking-wider hidden md:table-cell">Срок</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.name} className="border-t-2 border-ink/15">
                    <td className="p-3 font-mono text-[12px]">{r.name}</td>
                    <td className="p-3 quote">{r.purpose}</td>
                    <td className="p-3">{r.type}</td>
                    <td className="p-3 hidden sm:table-cell text-smoke">{r.storage}</td>
                    <td className="p-3 hidden md:table-cell text-smoke">{r.ttl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dotline my-10" />

          <h2 className="display text-3xl uppercase mb-5">Как отключить</h2>
          <ul className="space-y-3 quote text-[16px] text-ink/85">
            <li>— Очистите данные сайта в настройках браузера (DevTools → Application → Storage).</li>
            <li>— Используйте режим инкогнито — данные не сохранятся.</li>
            <li>— Отказ от аналитики не повлияет на корзину и оформление заказа.</li>
          </ul>

          <p className="mt-10 text-sm text-ink/70">
            Связанные документы:{" "}
            <Link href="/oferta" className="underline hover:text-crimson">Публичная оферта</Link>,{" "}
            <Link href="/policy" className="underline hover:text-crimson">Политика конфиденциальности</Link>.
          </p>
        </div>
      </article>
      <Footer />
      <CartDrawer />
    </main>
  );
}
