import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CartDrawer from "@/components/cart-drawer";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Политика конфиденциальности — PIZZAGRAM",
};

export default function PolicyPage() {
  return (
    <main>
      <Header />
      <article className="border-b-2 border-ink">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-12 lg:py-20">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-display uppercase tracking-wider hover:text-crimson mb-8">
            <ArrowLeft className="w-4 h-4" /> На главную
          </Link>
          <div className="eyebrow text-crimson">Документ № 03</div>
          <h1 className="display text-[clamp(40px,7vw,96px)] mt-3">
            Политика <br />
            <span className="text-crimson">конфиденциальности</span>
          </h1>
          <p className="quote text-lg text-ink/80 mt-5 max-w-2xl">
            Этот документ описывает, какие персональные данные обрабатывает
            ИП Ноздрачев И. Е. (ИНН 263213954032, ОГРНИП 325265100126742) (далее — Pizzagram) при оформлении заказа на pizzagram.ru.
          </p>
          <div className="dotline my-10" />

          <div className="space-y-6 quote text-[16px] leading-relaxed text-ink/85 max-w-2xl">
            <p>
              <strong className="not-italic font-medium">Что собираем.</strong> Имя, телефон,
              адрес доставки и комментарий к заказу. Эти данные нужны исключительно для того,
              чтобы оператор подтвердил заказ, а курьер довёз пиццу до вас.
            </p>
            <p>
              <strong className="not-italic font-medium">Где храним.</strong> Заказ автоматически
              отправляется в закрытый Telegram-чат пиццерии. Мы не передаём данные третьим лицам
              и не используем их для рекламы.
            </p>
            <p>
              <strong className="not-italic font-medium">Сколько храним.</strong> Сообщения
              о заказах остаются в Telegram оператора согласно его настройкам хранения. Удалить
              ваш заказ из истории можно по запросу — позвоните{" "}
              <a href="tel:+79298358881" className="underline hover:text-crimson">+7 (929) 835-88-81</a>.
            </p>
            <p>
              <strong className="not-italic font-medium">Аналитика.</strong> На сайте может
              работать Яндекс.Метрика — она получает только обезличенные данные о визите
              (страница, время, устройство). См.{" "}
              <Link href="/cookies" className="underline hover:text-crimson">политику cookies</Link>.
            </p>
            <p>
              <strong className="not-italic font-medium">Ваши права.</strong> По закону 152-ФЗ
              вы можете запросить удаление, исправление или экспорт ваших данных.
              Напишите в{" "}
              <a href="https://wa.me/79298358881" target="_blank" rel="noreferrer" className="underline hover:text-crimson">WhatsApp</a>{" "}
              или{" "}
              <a href="https://t.me/+79298358881" target="_blank" rel="noreferrer" className="underline hover:text-crimson">Telegram</a>{" "}
              на номер <a href="tel:+79298358881" className="underline hover:text-crimson">+7 (929) 835-88-81</a>.
            </p>
          </div>

          <p className="mt-12 text-sm text-ink/70">
            Связанные документы:{" "}
            <Link href="/oferta" className="underline hover:text-crimson">Публичная оферта</Link>,{" "}
            <Link href="/cookies" className="underline hover:text-crimson">Политика cookies</Link>.
          </p>
        </div>
      </article>
      <Footer />
      <CartDrawer />
    </main>
  );
}
