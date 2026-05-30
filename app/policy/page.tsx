import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CartDrawer from "@/components/cart-drawer";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Политика конфиденциальности — PIZZAGRAM",
  description: "Как Pizzagram обрабатывает и защищает персональные данные пользователей.",
};

type Block = { title: string; body: React.ReactNode };

const BLOCKS: Block[] = [
  {
    title: "Кто оператор",
    body: (
      <>
        Оператором персональных данных является{" "}
        <strong>ИП Ноздрачев И. Е.</strong> (ИНН&nbsp;263213954032,
        ОГРНИП&nbsp;325265100126742, 350000, Краснодарский край, г.&nbsp;Краснодар,
        ул.&nbsp;Красных Партизан, д.&nbsp;1/4, к.&nbsp;8) — далее «Pizzagram»,
        «мы» или «Оператор».
        <br /><br />
        Контакты по вопросам персональных данных:{" "}
        <a href="tel:+79298358881" className="underline hover:text-crimson">+7&nbsp;(929)&nbsp;835-88-81</a>,{" "}
        <a href="https://wa.me/79298358881" target="_blank" rel="noreferrer" className="underline hover:text-crimson">WhatsApp</a>,{" "}
        <a href="https://t.me/+79298358881" target="_blank" rel="noreferrer" className="underline hover:text-crimson">Telegram</a>.
      </>
    ),
  },
  {
    title: "Какие данные мы собираем",
    body: (
      <>
        При регистрации и оформлении заказа мы собираем:
        <ul className="mt-3 space-y-2 list-none">
          <li>— <strong>Номер телефона</strong> — для подтверждения личности через SMS-код и связи с вами по заказу.</li>
          <li>— <strong>Имя</strong> — для оформления заказа и обращения к вам.</li>
          <li>— <strong>Адрес доставки</strong> — для доставки заказа.</li>
          <li>— <strong>Комментарий к заказу</strong> — по вашему желанию, для уточнений при доставке.</li>
          <li>— <strong>Состав и сумма заказа</strong> — для исполнения договора купли-продажи.</li>
          <li>— <strong>IP-адрес</strong> — технический идентификатор, используется исключительно для защиты от автоматизированных злоупотреблений (не хранится в базе данных пользователей).</li>
        </ul>
        <br />
        Мы <strong>не собираем</strong> данные банковских карт — при онлайн-оплате вы вводите их
        непосредственно на защищённой странице ЮKassa и они нам недоступны.
      </>
    ),
  },
  {
    title: "Правовые основания обработки",
    body: (
      <>
        Обработка персональных данных осуществляется на следующих основаниях
        (Федеральный закон № 152-ФЗ «О персональных данных»):
        <ul className="mt-3 space-y-2 list-none">
          <li>— <strong>Исполнение договора</strong> (ст.&nbsp;6, ч.&nbsp;1, п.&nbsp;5) — имя, телефон, адрес доставки необходимы для доставки заказа.</li>
          <li>— <strong>Согласие субъекта</strong> (ст.&nbsp;6, ч.&nbsp;1, п.&nbsp;1) — при регистрации через SMS-код вы даёте согласие на обработку номера телефона.</li>
          <li>— <strong>Законный интерес</strong> (ст.&nbsp;6, ч.&nbsp;1, п.&nbsp;5) — технические меры защиты от злоупотреблений (rate limiting по IP).</li>
        </ul>
        <br />
        <em className="text-sm text-ink/60">Требует юр-проверки: формулировки оснований рекомендуется уточнить у специалиста по 152-ФЗ применительно к конкретной деятельности ИП.</em>
      </>
    ),
  },
  {
    title: "Где хранятся данные",
    body: (
      <>
        В соответствии с требованиями ст.&nbsp;18.1 Федерального закона №&nbsp;152-ФЗ
        первичная база данных с персональными данными российских граждан хранится{" "}
        <strong>на серверах в Российской Федерации</strong>:
        <br /><br />
        <strong>PostgreSQL-кластер Timeweb Cloud</strong> (Москва, РФ) — хранит: учётные
        записи пользователей (телефон, имя, адрес), историю заказов, одноразовые
        SMS-коды авторизации (удаляются после использования или по истечении 5 минут).
        <br /><br />
        Технические файлы меню и прайс-листа (без персональных данных) хранятся
        на серверах Vercel (США, CDN).
      </>
    ),
  },
  {
    title: "Кому мы передаём данные",
    body: (
      <>
        Для работы сервиса мы привлекаем следующих партнёров. Мы передаём им
        только те данные, которые необходимы для выполнения конкретной функции:

        <div className="mt-4 space-y-4">
          <div className="border-l-2 border-crimson pl-4">
            <strong>СМС-сервис SMSAero</strong> (ООО «Смс-аэро», РФ)<br />
            Передаётся: номер телефона и текст одноразового кода. Цель: доставка
            SMS с кодом подтверждения при входе. Данные не хранятся у агента дольше,
            чем необходимо для отправки.
          </div>

          <div className="border-l-2 border-crimson pl-4">
            <strong>ЮKassa</strong> (ООО НКО «ЮMoney», РФ)<br />
            Передаётся: сумма заказа, телефон покупателя, состав заказа (для
            формирования фискального чека). Данные банковских карт нам не передаются —
            они обрабатываются непосредственно ЮKassa. Цель: проведение онлайн-оплаты
            и формирование кассового чека согласно 54-ФЗ.
          </div>

          <div className="border-l-2 border-crimson pl-4">
            <strong>Telegram</strong> (Telegram FZ-LLC, ОАЭ)<br />
            Передаётся: имя, телефон, адрес доставки, состав заказа. Цель:
            уведомление сотрудников пиццерии о новом заказе через закрытый
            служебный чат. Данные видны только операторам Pizzagram.
          </div>

          <div className="border-l-2 border-crimson pl-4">
            <strong>Яндекс Карты API</strong> (ООО «Яндекс», РФ)<br />
            Передаётся: введённый вами адрес для геокодирования (определения
            координат и зоны доставки). Данные используются только для расчёта
            доставки и не сохраняются Яндексом в привязке к вашей личности.
          </div>

          <div className="border-l-2 border-ink/30 pl-4">
            <strong>Groq (AI-помощник)</strong> (Groq, Inc., США) — <em>только технические данные</em><br />
            Передаётся: текст вашего сообщения в чате помощника по выбору пиццы.
            Личные данные (имя, телефон, адрес) в AI-помощник не передаются и не
            должны вводиться в чат. Groq обрабатывает только текст запроса для
            формирования ответа и не использует его для обучения моделей.{" "}
            <em className="text-sm text-ink/60">Требует юр-проверки: передача текстовых сообщений за рубеж — уточните у юриста.</em>
          </div>

          <div className="border-l-2 border-ink/30 pl-4">
            <strong>Upstash Redis</strong> (Upstash, Inc., США) — <em>только технические данные</em><br />
            Передаётся исключительно техническая строка вида «тип_запроса:IP-адрес»
            (например, «sms:ip:1.2.3.4»). Персональные данные (имя, телефон, заказы)
            в Upstash не передаются. Цель: распределённый счётчик запросов для
            защиты от автоматизированных атак (rate limiting). Данные хранятся
            с коротким временем жизни (TTL от 1 минуты до 1 часа) и автоматически
            удаляются.
          </div>

          <div className="border-l-2 border-ink/30 pl-4">
            <strong>Vercel</strong> (Vercel, Inc., США) — <em>хостинг-провайдер</em><br />
            Обрабатывает входящие запросы как техническая инфраструктура.
            Персональные данные пользователей в хранилищах Vercel не сохраняются —
            они записываются только в базу Timeweb (РФ).
          </div>
        </div>

        <br />
        Мы не продаём данные третьим лицам и не используем их для таргетированной рекламы.
      </>
    ),
  },
  {
    title: "Сроки хранения",
    body: (
      <>
        <ul className="space-y-2 list-none">
          <li>— <strong>Данные заказов</strong> — хранятся в течение срока, необходимого
          для исполнения договора и соблюдения налогового законодательства (не менее 5 лет).</li>
          <li>— <strong>Учётная запись</strong> — до момента удаления по вашему запросу.
          После удаления история заказов может быть сохранена в обезличенном виде
          для бухгалтерских целей.</li>
          <li>— <strong>SMS-коды</strong> — 5 минут, затем автоматически удаляются.</li>
          <li>— <strong>Технические идентификаторы (IP) в Upstash</strong> — от 1 минуты
          до 1 часа, автоматическое удаление.</li>
          <li>— <strong>Уведомления в Telegram</strong> — хранятся в служебном чате
          операторов согласно настройкам удаления в Telegram. По запросу удаляем
          вручную.</li>
        </ul>
      </>
    ),
  },
  {
    title: "Меры защиты",
    body: (
      <>
        Мы принимаем технические и организационные меры для защиты данных:
        <ul className="mt-3 space-y-2 list-none">
          <li>— Соединение с сайтом защищено HTTPS с принудительным HSTS (2 года).</li>
          <li>— Сессионные токены хранятся в HttpOnly Secure cookies, недоступных JavaScript.</li>
          <li>— Цены и состав заказа проверяются на сервере — клиентские данные о стоимости игнорируются.</li>
          <li>— Все уведомления о платежах от ЮKassa проверяются по IP-адресу и сумме заказа.</li>
          <li>— Защита от перебора кодов: ограничение числа попыток по IP и телефону.</li>
          <li>— Доступ к административной панели защищён отдельным паролем и JWT-токеном.</li>
          <li>— Резервные копии базы данных создаются ежедневно (Timeweb Backup).</li>
        </ul>
      </>
    ),
  },
  {
    title: "Cookies и сессии",
    body: (
      <>
        Сайт использует cookies и localStorage. Подробная таблица — в{" "}
        <Link href="/cookies" className="underline hover:text-crimson">Политике cookies</Link>.
        <br /><br />
        <strong>Сессионный токен</strong> («session»): записывается в cookie после входа
        через SMS-код. Хранится 7 дней, помечен как HttpOnly и Secure — его нельзя
        прочитать через JavaScript и он не передаётся по незащищённому соединению.
      </>
    ),
  },
  {
    title: "Ваши права",
    body: (
      <>
        Согласно Федеральному закону №&nbsp;152-ФЗ вы вправе:
        <ul className="mt-3 space-y-2 list-none">
          <li>— Получить информацию о том, какие ваши данные мы обрабатываем.</li>
          <li>— Потребовать исправления неточных данных.</li>
          <li>— Потребовать удаления данных (с учётом требований налогового законодательства).</li>
          <li>— Отозвать согласие на обработку данных.</li>
          <li>— Обратиться с жалобой в Роскомнадзор.</li>
        </ul>
        <br />
        Для реализации любого из прав напишите нам:{" "}
        <a href="https://wa.me/79298358881" target="_blank" rel="noreferrer" className="underline hover:text-crimson">WhatsApp</a>{" "}
        или{" "}
        <a href="https://t.me/+79298358881" target="_blank" rel="noreferrer" className="underline hover:text-crimson">Telegram</a>{" "}
        на номер{" "}
        <a href="tel:+79298358881" className="underline hover:text-crimson">+7&nbsp;(929)&nbsp;835-88-81</a>.
        Срок рассмотрения — не более 30 дней.
      </>
    ),
  },
  {
    title: "Изменения в политике",
    body: (
      <>
        Мы можем обновлять этот документ. Актуальная версия всегда доступна по адресу{" "}
        <Link href="/policy" className="underline hover:text-crimson">pizzagram.ru/policy</Link>.
        При существенных изменениях мы уведомим через сайт.
      </>
    ),
  },
];

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
            ИП&nbsp;Ноздрачев И.&nbsp;Е. (ИНН&nbsp;263213954032,
            ОГРНИП&nbsp;325265100126742) при использовании сайта pizzagram.ru,
            кому мы их передаём и как защищаем.
          </p>
          <div className="mt-4 text-sm text-ink/60">Редакция от 30.05.2026</div>
          <div className="dotline my-10" />

          <div className="space-y-10 max-w-2xl">
            {BLOCKS.map((b) => (
              <section key={b.title}>
                <h2 className="display text-xl sm:text-2xl uppercase mb-3">{b.title}</h2>
                <div className="quote text-[16px] leading-relaxed text-ink/85">{b.body}</div>
              </section>
            ))}
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
