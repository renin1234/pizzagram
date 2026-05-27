"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { X, Minus, Plus, ShoppingBag, ArrowLeft, Check } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-store";
import { cn, formatRub, shopStatus } from "@/lib/utils";
import { deliveryCost } from "@/lib/delivery-zones";
import DeliveryMap, { type AddressResult } from "./delivery-map";
import { SAUCE_EXTRAS, type Extra } from "@/lib/extras";

type Stage = "cart" | "checkout" | "success";
type Method = "delivery" | "pickup";
type Payment = "online" | "card_courier" | "cash";

export default function CartDrawer() {
  const open = useCart((s) => s.drawerOpen);
  const close = useCart((s) => s.closeDrawer);
  const lines = useCart((s) => s.lines);
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const total = useCart((s) => s.totalPrice());

  const [stage, setStage] = useState<Stage>("cart");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    const check = () => setIsClosed(!shopStatus().open);
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, []);

  // form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [method, setMethod] = useState<Method>("delivery");
  const [apt, setApt] = useState("");
  const [floor, setFloor] = useState("");
  const [privateHouse, setPrivateHouse] = useState(false);

  const authUser = useAuth((s) => s.user);

  useEffect(() => {
    if (authUser) {
      if (authUser.name) setName(authUser.name);
      if (authUser.phone) setPhone(authUser.phone);
      if (authUser.address) setAddress(authUser.address);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);
  const [payment, setPayment] = useState<Payment>("online");
  const [comment, setComment] = useState("");
  const [delivery, setDelivery] = useState<AddressResult | null>(null);
  const [sauces, setSauces] = useState<Extra[]>(SAUCE_EXTRAS);

  useEffect(() => {
    fetch("/api/extras")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { sauces?: Extra[] } | null) => {
        if (d?.sauces) setSauces(d.sauces);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) {
      // Reset stage after the drawer closes
      const t = setTimeout(() => setStage("cart"), 250);
      return () => clearTimeout(t);
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const selectMethod = (m: Method) => {
    setMethod(m);
    if (m === "pickup") {
      setDelivery(null);
    }
    if (m === "delivery") {
      setPayment("online");
    }
  };

  const discount = 0;
  const deliveryZone = method === "delivery" ? delivery?.zone ?? null : null;
  const deliveryPrice = method === "delivery" ? deliveryCost(deliveryZone, total) : 0;
  const minOrder = deliveryZone ? deliveryZone.minOrder : 0;
  const belowMin = method === "delivery" && minOrder > 0 && total < minOrder;
  const grand = total + deliveryPrice - discount;

  const addressMissing = method === "delivery" && (!delivery || !delivery.deliverable);
  const blocked = submitting || belowMin || addressMissing;

  const deliveryLineText = () => {
    if (!delivery) return "уточните адрес";
    if (!delivery.deliverable) return "вне зоны";
    if (deliveryPrice === 0) return "бесплатно";
    return formatRub(deliveryPrice);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || phone.trim().length < 6) {
      setError("Укажите имя и телефон");
      return;
    }
    if (method === "delivery") {
      if (!delivery) {
        setError("Укажите адрес доставки на карте");
        return;
      }
      if (!delivery.deliverable) {
        setError("Этот адрес вне зоны доставки — выберите самовывоз");
        return;
      }
      if (!privateHouse && !apt.trim()) {
        setError("Укажите номер квартиры (или отметьте «Частный дом»)");
        return;
      }
      if (!privateHouse && !floor.trim()) {
        setError("Укажите этаж (или отметьте «Частный дом»)");
        return;
      }
      if (belowMin) {
        setError(`Минимальный заказ для вашей зоны — ${formatRub(minOrder)}`);
        return;
      }
    }
    setSubmitting(true);

    const orderPayload = {
      name,
      phone,
      address:
        method === "delivery"
          ? [
              delivery?.address ?? "",
              !privateHouse && apt.trim() ? `кв. ${apt.trim()}` : null,
              !privateHouse && floor.trim() ? `этаж ${floor.trim()}` : null,
            ]
              .filter(Boolean)
              .join(", ")
          : "Самовывоз — ул. Красных Партизан, 1/4 к.8",
      method,
      payment,
      comment,
      lines: lines.map((l) => ({
        name: l.name,
        sizeLabel: l.sizeLabel,
        qty: l.qty,
        price: l.price + (l.extras ?? []).reduce((s, e) => s + e.price, 0),
        extras: (l.extras ?? []).length > 0 ? l.extras : undefined,
      })),
      subtotal: total,
      deliveryPrice,
      discount,
      total: grand,
    };

    try {
      if (payment === "online") {
        const res = await fetch("/api/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || "Не удалось создать счёт оплаты");
        }
        if (data.paymentUrl) {
          clear();
          window.location.assign(data.paymentUrl);
          return;
        }
        // PayKeeper не настроен — показываем «успех» и предупреждение про симуляцию.
        setStage("success");
        clear();
        if (data.warning) console.warn(data.warning);
        return;
      }

      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Не удалось отправить заказ");
      }
      setStage("success");
      clear();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        className={cn(
          "fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />
      {/* Drawer */}
      <aside
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[460px] bg-cream border-l-2 border-ink flex flex-col transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-ink bg-cream-deep">
          <div className="flex items-center gap-2">
            {stage !== "cart" && stage !== "success" && (
              <button
                onClick={() => setStage("cart")}
                className="w-10 h-10 border-2 border-ink bg-cream flex items-center justify-center hover:bg-ink hover:text-cream transition-colors"
                aria-label="Назад"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="font-display uppercase text-xl tracking-wider">
              {stage === "cart" && "Корзина"}
              {stage === "checkout" && "Оформление"}
              {stage === "success" && "Принято"}
            </div>
          </div>
          <button
            onClick={close}
            className="w-10 h-10 border-2 border-ink bg-cream flex items-center justify-center hover:bg-crimson hover:text-cream transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {stage === "cart" && (
            <CartList lines={lines} setQty={setQty} remove={remove} add={add} sauces={sauces} />
          )}
          {stage === "checkout" && (
            <CheckoutForm
              name={name} setName={setName}
              phone={phone} setPhone={setPhone}
              method={method} setMethod={selectMethod}
              payment={payment} setPayment={setPayment}
              comment={comment} setComment={setComment}
              delivery={delivery} setDelivery={setDelivery}
              apt={apt} setApt={setApt}
              floor={floor} setFloor={setFloor}
              privateHouse={privateHouse} setPrivateHouse={setPrivateHouse}
              belowMin={belowMin} minOrder={minOrder} total={total}
              onSubmit={submit}
              submitting={submitting}
              error={error}
            />
          )}
          {stage === "success" && <Success onClose={close} />}
        </div>

        {/* Footer */}
        {stage !== "success" && lines.length > 0 && (
          <div className="p-4 border-t-2 border-ink bg-cream-deep space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-display uppercase tracking-widest text-smoke">Товары</span>
              <span className="font-medium">{formatRub(total)}</span>
            </div>
            {stage === "checkout" && method === "delivery" && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-display uppercase tracking-widest text-smoke">Доставка</span>
                <span
                  className={cn(
                    "font-medium",
                    delivery?.deliverable && deliveryPrice === 0 && "text-crimson"
                  )}
                >
                  {deliveryLineText()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="font-display uppercase tracking-widest text-sm">Итого</span>
              <span className="font-display text-3xl leading-none">{formatRub(grand)}</span>
            </div>
            {stage === "checkout" && belowMin && (
              <div className="text-[12px] text-crimson">
                До минимального заказа не хватает{" "}
                {formatRub(Math.max(0, minOrder - total))}
              </div>
            )}

            {isClosed ? (
              <div className="border-2 border-ink bg-ink text-cream text-center p-4">
                <div className="font-display uppercase tracking-widest text-sm">Кухня закрыта</div>
                <div className="text-xs mt-1 text-cream/70">Заказы принимаем с 11:00 до 21:45</div>
              </div>
            ) : stage === "cart" ? (
              <button
                onClick={() => setStage("checkout")}
                className="btn-primary w-full justify-center text-base"
              >
                Оформить заказ
              </button>
            ) : (
              <button
                form="checkout-form"
                disabled={blocked}
                className="btn-primary w-full justify-center text-base disabled:opacity-60"
              >
                {submitting
                  ? payment === "online" ? "Открываем оплату..." : "Отправляем..."
                  : payment === "online"
                  ? `Перейти к оплате — ${formatRub(grand)}`
                  : `Оформить заказ — ${formatRub(grand)}`}
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

function CartList({
  lines,
  setQty,
  remove,
  add,
  sauces,
}: {
  lines: ReturnType<typeof useCart.getState>["lines"];
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  add: ReturnType<typeof useCart.getState>["add"];
  sauces: Extra[];
}) {
  // Соус уже выбран — либо как extra на закуске, либо как отдельная строка
  const hasSauce = lines.some(
    (l) =>
      l.itemId.startsWith("sauce-") ||
      (l.extras ?? []).some((e) => e.id.startsWith("sauce-")),
  );
  const hasSnack = lines.some((l) => l.itemId.startsWith("snack-"));

  if (lines.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-3">
        <ShoppingBag className="w-12 h-12 text-ink/30" />
        <div className="font-display text-2xl uppercase">Пока пусто</div>
        <p className="quote text-ink/70">
          Соберите свой заказ из меню — мы быстро все испечем.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y-2 divide-ink/10">
        {lines.map((l) => (
          <li key={l.id} className="p-4 flex gap-3">
            <div className="relative w-20 h-20 shrink-0 border-2 border-ink overflow-hidden flex items-center justify-center bg-cream-deep">
              {l.image ? (
                <Image src={l.image} alt={l.name} fill sizes="80px" className="object-cover" />
              ) : (
                <span className="text-3xl select-none">🥫</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display uppercase text-[17px] leading-tight">{l.name}</div>
                  <div className="text-[12px] text-smoke mt-0.5">{l.sizeLabel}</div>
                  {(l.extras ?? []).length > 0 && (
                    <div className="text-[11px] text-smoke/80 mt-0.5 leading-snug">
                      + {(l.extras ?? []).map(e => e.name).join(", ")}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => remove(l.id)}
                  className="w-10 h-10 flex items-center justify-center -mr-2 text-smoke hover:text-crimson transition-colors"
                  aria-label="Удалить"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="inline-flex items-center border-2 border-ink">
                  <button
                    onClick={() => setQty(l.id, l.qty - 1)}
                    className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-ink hover:text-cream"
                    aria-label="Меньше"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 sm:w-8 text-center font-medium">{l.qty}</span>
                  <button
                    onClick={() => setQty(l.id, l.qty + 1)}
                    className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-ink hover:text-cream"
                    aria-label="Больше"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="font-display text-xl">
                  {formatRub((l.price + (l.extras ?? []).reduce((s, e) => s + e.price, 0)) * l.qty)}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {hasSnack && !hasSauce && (
        <div className="p-4 border-t-2 border-ink/10 bg-cream-deep/40">
          <div className="eyebrow text-smoke text-[11px] mb-2.5">Добавить соус к закуске? · 25 мл · 40 ₽</div>
          <div className="flex flex-wrap gap-1.5">
            {sauces.map((sauce) => (
              <button
                key={sauce.id}
                onClick={() =>
                  add({
                    itemId: sauce.id,
                    name: `Соус ${sauce.name.toLowerCase()}`,
                    sizeLabel: "25 мл",
                    price: sauce.price,
                    image: "",
                  })
                }
                className="border-2 border-ink px-3 py-1.5 text-[12px] font-display uppercase tracking-wide hover:bg-ink hover:text-cream transition-colors"
              >
                {sauce.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function CheckoutForm(props: {
  name: string; setName: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  method: Method; setMethod: (m: Method) => void;
  payment: Payment; setPayment: (p: Payment) => void;
  comment: string; setComment: (v: string) => void;
  delivery: AddressResult | null;
  setDelivery: (r: AddressResult | null) => void;
  apt: string; setApt: (v: string) => void;
  floor: string; setFloor: (v: string) => void;
  privateHouse: boolean; setPrivateHouse: (v: boolean) => void;
  belowMin: boolean;
  minOrder: number;
  total: number;
  onSubmit: (e: FormEvent) => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <form id="checkout-form" onSubmit={props.onSubmit} className="p-4 space-y-4">
      <Field label="Имя">
        <input
          value={props.name}
          onChange={(e) => props.setName(e.target.value)}
          required
          placeholder="Иван"
          className="input"
        />
      </Field>
      <Field label="Телефон">
        <input
          value={props.phone}
          onChange={(e) => props.setPhone(e.target.value)}
          required
          type="tel"
          placeholder="+7 900 123-45-67"
          className="input"
        />
        <span className="block text-[11px] text-smoke mt-1">Полный номер с кодом страны — нужен для чека</span>
      </Field>

      <Field label="Способ получения">
        <div className="grid grid-cols-2 gap-2">
          {(["delivery", "pickup"] as Method[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => props.setMethod(m)}
              className={cn(
                "border-2 border-ink p-3 text-left transition-colors",
                props.method === m ? "bg-ink text-cream" : "bg-cream hover:bg-cream-deep"
              )}
            >
              <div className="font-display uppercase tracking-wider text-sm">
                {m === "delivery" ? "Доставка" : "Самовывоз"}
              </div>
              <div className={cn("text-[12px] mt-1", props.method === m ? "text-cream/70" : "text-smoke")}>
                {m === "delivery" ? "Быстрая доставка по городу" : "Готово через 20 минут"}
              </div>
            </button>
          ))}
        </div>
      </Field>

      {props.method === "delivery" && (
        <div className="space-y-3">
          <span className="block font-display uppercase tracking-widest text-[11px] text-smoke">
            Адрес доставки
          </span>
          <DeliveryMap variant="compact" onResult={props.setDelivery} />

          {/* Квартира / Этаж / Частный дом */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <button
              type="button"
              role="checkbox"
              aria-checked={props.privateHouse}
              onClick={() => props.setPrivateHouse(!props.privateHouse)}
              className={cn(
                "w-5 h-5 shrink-0 border-2 border-ink flex items-center justify-center transition-colors",
                props.privateHouse ? "bg-ink text-cream" : "bg-cream hover:bg-cream-deep"
              )}
            >
              {props.privateHouse && <Check className="w-3 h-3" strokeWidth={3} />}
            </button>
            <span className="font-display uppercase tracking-widest text-[11px] text-smoke">
              Частный дом
            </span>
          </label>

          {!props.privateHouse && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Квартира">
                <input
                  value={props.apt}
                  onChange={(e) => props.setApt(e.target.value)}
                  required
                  placeholder="42"
                  className="input"
                />
              </Field>
              <Field label="Этаж">
                <input
                  value={props.floor}
                  onChange={(e) => props.setFloor(e.target.value)}
                  required
                  placeholder="5"
                  className="input"
                />
              </Field>
            </div>
          )}

          {props.belowMin && (
            <div className="border-2 border-crimson bg-crimson/10 text-crimson p-3 text-sm">
              Минимальный заказ для вашей зоны — {formatRub(props.minOrder)}. Добавьте
              товаров ещё на {formatRub(Math.max(0, props.minOrder - props.total))}.
            </div>
          )}
        </div>
      )}

      {props.method === "pickup" && (
        <div className="border-2 border-ink bg-cream p-3 text-sm">
          <div className="font-display uppercase tracking-wider text-[13px]">
            Адрес самовывоза
          </div>
          <p className="text-ink/75 mt-1">
            ул. Красных Партизан, 1/4 к.8 · ЖК «Светлоград». Готовность — 20 минут
            после оплаты.
          </p>
        </div>
      )}

      <Field label="Оплата">
        <div className="grid grid-cols-1 gap-2">
          {(
            props.method === "delivery"
              ? [
                  {
                    id: "online" as Payment,
                    title: "Онлайн — картой или СБП",
                    desc: "Откроется защищённая страница ЮКассы. Деньги сразу зачислятся, оператор начнёт готовить заказ.",
                  },
                ]
              : [
                  {
                    id: "online" as Payment,
                    title: "Онлайн — картой или СБП",
                    desc: "Откроется защищённая страница ЮКассы. Деньги сразу зачислятся.",
                  },
                  {
                    id: "cash" as Payment,
                    title: "Наличными",
                    desc: "При получении в пиццерии.",
                  },
                ]
          ).map((p) => {
            const active = props.payment === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => props.setPayment(p.id)}
                className={cn(
                  "border-2 border-ink p-3 text-left transition-colors",
                  active ? "bg-ink text-cream" : "bg-cream hover:bg-cream-deep",
                )}
              >
                <div className="font-display uppercase tracking-wider text-sm">{p.title}</div>
                <div className={cn("text-[12px] mt-1", active ? "text-cream/70" : "text-smoke")}>
                  {p.desc}
                </div>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Комментарий">
        <textarea
          value={props.comment}
          onChange={(e) => props.setComment(e.target.value)}
          rows={3}
          placeholder="Без лука, позвоните за 10 минут до приезда..."
          className="input resize-none"
        />
      </Field>

      {props.error && (
        <div className="border-2 border-crimson bg-crimson/10 text-crimson p-3 text-sm">
          {props.error}
        </div>
      )}

      <p className="text-[11px] text-smoke leading-relaxed">
        Нажимая «Отправить», вы соглашаетесь с условиями оферты и обработкой
        персональных данных. 
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-display uppercase tracking-widest text-[11px] text-smoke mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}

function Success({ onClose }: { onClose: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-4">
      <div className="w-16 h-16 rounded-full bg-crimson text-cream border-2 border-ink flex items-center justify-center shadow-[6px_6px_0_var(--ink)]">
        <Check className="w-8 h-8" strokeWidth={3} />
      </div>
      <div className="font-display text-3xl uppercase">Заказ принят</div>
      <p className="quote text-ink/75 max-w-xs">
        Мы уже разогреваем печь.
      </p>
      <button onClick={onClose} className="btn-secondary mt-3">
        Закрыть
      </button>
    </div>
  );
}
