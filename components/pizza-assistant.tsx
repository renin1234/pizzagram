"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Plus } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { useAssistant } from "@/lib/assistant-store";
import { cn, formatRub } from "@/lib/utils";

/**
 * Чат-виджет ИИ-помощника по выбору пиццы (Фича 7).
 * Открывается из строки-входа в секции меню через стор useAssistant.
 * Запросы уходят на /api/pizza-assistant (Gemini, ключ только на сервере).
 */

type RecommendedPizza = {
  id: string;
  name: string;
  price: number;
  sizeLabel: string;
  image: string;
};

type Msg = {
  role: "user" | "assistant";
  content: string;
  recommend?: RecommendedPizza[];
};

const GREETING: Msg = {
  role: "assistant",
  content:
    "Привет! Помогу выбрать из меню — пиццу, закуску или напиток. Расскажите, чего хочется.",
};

export default function PizzaAssistant() {
  const open = useAssistant((s) => s.open);
  const setOpen = useAssistant((s) => s.setOpen);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Автоскролл ленты вниз при новом сообщении.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/pizza-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      setMessages((m) => [
        ...m,
        res.ok
          ? {
              role: "assistant",
              content: data.reply || "",
              recommend: Array.isArray(data.recommend) ? data.recommend : [],
            }
          : {
              role: "assistant",
              content:
                data.error || "Что-то пошло не так. Попробуйте ещё раз.",
            },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Нет связи с помощником. Попробуйте позже.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Панель всегда в DOM: видимость и сдвиг анимируются классами по `open`
  // (CSS-transition открывает и закрывает), `inert` убирает скрытую панель
  // из фокуса и кликов.
  return (
    <div
      inert={!open}
      className={cn(
        "fixed z-40 inset-x-3 bottom-36 lg:inset-x-auto lg:right-6 lg:bottom-24 lg:w-[380px] max-h-[68vh] flex flex-col border-2 border-ink bg-cream shadow-[8px_8px_0_var(--ink)]",
        "transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)] origin-bottom-right",
        open ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95",
      )}
    >
      <div className="flex items-center gap-2 p-3 border-b-2 border-ink bg-ink text-cream">
        <Sparkles className="w-4 h-4 text-crimson" />
        <div className="font-display uppercase tracking-wider text-sm">
          Помощник по выбору
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Закрыть"
          className="ml-auto -mr-1 p-1 text-cream/70 hover:text-cream transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m, i) => (
          <ChatBubble key={i} msg={m} />
        ))}
        {loading && (
          <div className="chat-msg-bot text-left">
            <div
              className="inline-flex items-center gap-1.5 border-2 border-ink bg-cream px-3 py-2.5"
              aria-label="Помощник печатает"
            >
              <span className="chat-dot w-1.5 h-1.5 rounded-full bg-ink/50" />
              <span
                className="chat-dot w-1.5 h-1.5 rounded-full bg-ink/50"
                style={{ animationDelay: "0.15s" }}
              />
              <span
                className="chat-dot w-1.5 h-1.5 rounded-full bg-ink/50"
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t-2 border-ink flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Что хотите?"
          className="input !py-2 text-sm"
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          aria-label="Отправить"
          className="shrink-0 w-10 h-10 border-2 border-ink bg-crimson text-cream flex items-center justify-center hover:bg-ink transition-colors disabled:opacity-50"
        >
          <Send className={cn("w-4 h-4", loading && "send-spin")} />
        </button>
      </div>
    </div>
  );
}

function ChatBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn(isUser ? "chat-msg-user text-right" : "chat-msg-bot text-left")}>
      {msg.content && (
        <div
          className={
            "inline-block max-w-[88%] border-2 border-ink px-3 py-2 text-[13px] leading-snug text-left " +
            (isUser ? "bg-ink text-cream" : "bg-cream")
          }
        >
          {msg.content}
        </div>
      )}
      {msg.recommend && msg.recommend.length > 0 && (
        <div className="mt-2 space-y-2">
          {msg.recommend.map((p, idx) => (
            <PizzaRec key={p.id} pizza={p} index={idx} />
          ))}
        </div>
      )}
    </div>
  );
}

function PizzaRec({ pizza, index = 0 }: { pizza: RecommendedPizza; index?: number }) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  return (
    <div
      className="reco-in flex items-center gap-2 border-2 border-ink bg-cream-deep p-2"
      style={{ animationDelay: `${index * 75}ms` }}
    >
      <div className="min-w-0 flex-1">
        <div className="font-display uppercase text-[13px] leading-tight truncate">
          {pizza.name}
        </div>
        <div className="text-[11px] text-smoke">{formatRub(pizza.price)}</div>
      </div>
      <button
        onClick={() => {
          add({
            itemId: pizza.id,
            name: pizza.name,
            sizeLabel: pizza.sizeLabel,
            price: pizza.price,
            image: pizza.image,
          });
          setAdded(true);
        }}
        className="shrink-0 inline-flex items-center gap-1 border-2 border-ink bg-crimson text-cream px-2 py-1 text-[11px] font-display uppercase tracking-wider hover:bg-ink transition-colors"
      >
        {added ? (
          "В корзине"
        ) : (
          <>
            <Plus className="w-3 h-3" /> В корзину
          </>
        )}
      </button>
    </div>
  );
}
