"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  PIZZERIA_COORDS,
  DELIVERY_ZONES,
  FREE_DELIVERY_FROM,
  resolveZone,
  type DeliveryZone,
} from "@/lib/delivery-zones";
import { formatRub } from "@/lib/utils";

export type AddressResult = {
  address: string;
  coords: [number, number];
  zone: DeliveryZone | null;
  distanceKm: number;
  deliverable: boolean;
};

type GeoHit = { address: string; coords: [number, number] };

const YMAPS_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY ?? "";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Грузим скрипт Яндекс.Карт один раз на всё приложение — только для отрисовки карты. */
let ymapsPromise: Promise<any> | null = null;
function loadYmaps(): Promise<any> {
  if (ymapsPromise) return ymapsPromise;
  ymapsPromise = new Promise<any>((resolve, reject) => {
    const w = window as any;
    if (w.ymaps) {
      w.ymaps.ready(() => resolve(w.ymaps));
      return;
    }
    const script = document.createElement("script");
    script.src = `https://api-maps.yandex.ru/2.1/?apikey=${YMAPS_KEY}&lang=ru_RU`;
    script.async = true;
    script.onload = () =>
      (window as any).ymaps.ready(() => resolve((window as any).ymaps));
    script.onerror = () => reject(new Error("yandex maps script failed"));
    document.head.appendChild(script);
  });
  return ymapsPromise;
}

type Props = {
  variant?: "full" | "compact";
  onResult?: (r: AddressResult | null) => void;
};

export default function DeliveryMap({ variant = "full", onResult }: Props) {
  const inputId = useId();
  const mapBoxRef = useRef<HTMLDivElement>(null);

  const ymapsRef = useRef<any>(null);
  const mapInstRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const reverseGeocodeRef = useRef<(c: [number, number]) => void>();
  // Не показывать подсказки, когда поле заполняется программно (после выбора).
  const lockSuggestRef = useRef(false);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [result, setResult] = useState<AddressResult | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeoHit[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const compact = variant === "compact";

  const emit = useCallback((r: AddressResult | null) => {
    setResult(r);
    onResultRef.current?.(r);
  }, []);

  /** Ставит метку на карте (если она загрузилась) и отдаёт результат с зоной. */
  const applyPoint = useCallback(
    (coords: [number, number], address: string) => {
      setGeoError(null);
      const zr = resolveZone(coords);
      const ymaps = ymapsRef.current;
      const map = mapInstRef.current;
      if (ymaps && map) {
        if (placemarkRef.current) {
          placemarkRef.current.geometry.setCoordinates(coords);
        } else {
          const pm = new ymaps.Placemark(
            coords,
            {},
            { draggable: true, preset: "islands#blackDotIcon" },
          );
          pm.events.add("dragend", () => {
            reverseGeocodeRef.current?.(
              pm.geometry.getCoordinates() as [number, number],
            );
          });
          map.geoObjects.add(pm);
          placemarkRef.current = pm;
        }
        placemarkRef.current.options.set(
          "iconColor",
          zr.deliverable ? "#1E1E1E" : "#FF4D39",
        );
        map.setCenter(coords, Math.max(map.getZoom(), 14), { duration: 250 });
      }
      lockSuggestRef.current = true;
      setQuery(address);
      setSuggestOpen(false);
      emit({
        address,
        coords,
        zone: zr.zone,
        distanceKm: zr.distanceKm,
        deliverable: zr.deliverable,
      });
    },
    [emit],
  );

  /** Координаты → адрес (обратное геокодирование через наш /api/geocode). */
  const reverseGeocode = useCallback(
    async (coords: [number, number]) => {
      const fallback = `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`;
      try {
        const res = await fetch(`/api/geocode?lat=${coords[0]}&lon=${coords[1]}`);
        const data = res.ok ? await res.json() : null;
        applyPoint(coords, data?.address || fallback);
      } catch {
        applyPoint(coords, fallback);
      }
    },
    [applyPoint],
  );
  reverseGeocodeRef.current = reverseGeocode;

  /** Текстовый поиск адреса — по кнопке «Найти» или Enter. */
  const runSearch = useCallback(
    async (raw: string) => {
      const term = raw.trim();
      if (!term) return;
      setSuggestOpen(false);
      setGeoError(null);
      setBusy(true);
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(term)}&limit=1`,
        );
        const data = res.ok ? await res.json() : null;
        const hit: GeoHit | undefined = data?.results?.[0];
        if (!hit) {
          setGeoError("Адрес не найден — уточните улицу и номер дома.");
          emit(null);
          return;
        }
        applyPoint(hit.coords, hit.address);
      } catch {
        setGeoError("Не удалось определить адрес. Попробуйте ещё раз.");
        emit(null);
      } finally {
        setBusy(false);
      }
    },
    [applyPoint, emit],
  );

  // Автоподсказки адреса: дебаунс-запрос к нашему геокодеру.
  useEffect(() => {
    if (lockSuggestRef.current) {
      lockSuggestRef.current = false;
      setSuggestions([]);
      return;
    }
    const term = query.trim();
    if (term.length < 3) {
      setSuggestions([]);
      return;
    }
    let alive = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/geocode?q=${encodeURIComponent(term)}&limit=5`,
        );
        if (!res.ok) throw new Error("geocode failed");
        const data = await res.json();
        if (alive) {
          setSuggestions(Array.isArray(data.results) ? data.results : []);
        }
      } catch {
        if (alive) setSuggestions([]);
      }
    }, 350);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  // Отрисовка карты Яндекса. Геокодинг идёт мимо неё — через /api/geocode,
  // поэтому поиск адреса работает, даже если карта не загрузилась.
  useEffect(() => {
    if (!YMAPS_KEY) {
      setStatus("error");
      return;
    }
    let destroyed = false;

    loadYmaps()
      .then((ymaps: any) => {
        if (destroyed || !mapBoxRef.current) return;
        ymapsRef.current = ymaps;

        const map = new ymaps.Map(
          mapBoxRef.current,
          {
            center: PIZZERIA_COORDS,
            zoom: compact ? 11 : 12,
            controls: ["zoomControl", "geolocationControl"],
          },
          { suppressMapOpenBlock: true },
        );
        mapInstRef.current = map;

        // Зоны доставки: рисуем от большой к малой, чтобы внутренние были сверху.
        [...DELIVERY_ZONES]
          .sort((a, b) => b.maxRadiusKm - a.maxRadiusKm)
          .forEach((z) => {
            map.geoObjects.add(
              new ymaps.Circle(
                [PIZZERIA_COORDS, z.maxRadiusKm * 1000],
                { hintContent: `${z.name} · доставка ${z.price} ₽` },
                {
                  fillColor: z.color,
                  fillOpacity: 0.08,
                  strokeColor: z.color,
                  strokeWidth: 2,
                  strokeOpacity: 0.85,
                  interactivityModel: "default#transparent",
                },
              ),
            );
          });

        // Маркер пиццерии.
        map.geoObjects.add(
          new ymaps.Placemark(
            PIZZERIA_COORDS,
            {
              hintContent: "Pizzagram",
              balloonContent: "Pizzagram — ул. Красных Партизан, 1/4 к.8",
            },
            { preset: "islands#redFoodIcon" },
          ),
        );

        // Клик по карте — ставим точку доставки.
        map.events.add("click", (e: any) => {
          reverseGeocodeRef.current?.(e.get("coords") as [number, number]);
        });

        setStatus("ready");
      })
      .catch(() => {
        if (!destroyed) setStatus("error");
      });

    return () => {
      destroyed = true;
      if (mapInstRef.current) {
        try {
          mapInstRef.current.destroy();
        } catch {
          /* noop */
        }
      }
      mapInstRef.current = null;
      placemarkRef.current = null;
      ymapsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact]);

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id={inputId}
            type="text"
            autoComplete="off"
            placeholder="Введите адрес: улица и номер дома"
            className="input"
            value={query}
            disabled={status === "loading"}
            onChange={(e) => {
              lockSuggestRef.current = false;
              setQuery(e.target.value);
              setSuggestOpen(true);
              if (!e.target.value.trim()) {
                setGeoError(null);
                emit(null);
              }
            }}
            onFocus={() => {
              if (suggestions.length > 0) setSuggestOpen(true);
            }}
            onBlur={() => {
              window.setTimeout(() => setSuggestOpen(false), 150);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void runSearch(query);
              }
            }}
          />
          {suggestOpen && suggestions.length > 0 && (
            <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto border-2 border-ink bg-cream shadow-[4px_4px_0_var(--ink)]">
              {suggestions.map((s, i) => (
                <li key={`${s.address}-${i}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyPoint(s.coords, s.address);
                    }}
                    className="block w-full border-b border-ink/10 px-3 py-2 text-left text-[13px] last:border-0 hover:bg-cream-deep"
                  >
                    {s.address}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {status !== "loading" && (
          <button
            type="button"
            onClick={() => void runSearch(query)}
            disabled={busy}
            className="btn-secondary !px-4 shrink-0 disabled:opacity-50"
          >
            {busy ? "Ищем…" : "Найти"}
          </button>
        )}
      </div>

      <div className="relative mt-3 border-2 border-ink overflow-hidden">
        <div ref={mapBoxRef} className={compact ? "h-[240px]" : "h-[300px] sm:h-[440px]"} />
        {status !== "ready" && (
          <div className="absolute inset-0 flex items-center justify-center bg-cream-deep p-5 text-center">
            {status === "loading" ? (
              <span className="quote text-ink/55">Загружаем карту…</span>
            ) : (
              <span className="quote text-ink/70 text-sm max-w-xs">
                Карта временно недоступна, но поиск адреса работает — впишите
                улицу и номер дома в поле выше и нажмите «Найти».
              </span>
            )}
          </div>
        )}
      </div>

      {status === "ready" && !result && !geoError && (
        <p className="text-[12px] text-smoke mt-2">
          Начните вводить адрес и выберите из подсказок или поставьте точку
          прямо на карте.
        </p>
      )}

      {geoError && <p className="text-[13px] text-crimson mt-2">{geoError}</p>}

      {result && <ResultPanel result={result} />}

      {!compact && <ZoneLegend />}
    </div>
  );
}

function ResultPanel({ result }: { result: AddressResult }) {
  if (!result.deliverable) {
    return (
      <div className="mt-3 border-2 border-crimson bg-crimson/10 p-3">
        <div className="font-display uppercase text-sm text-crimson">
          Вне зоны доставки
        </div>
        <p className="text-[13px] text-ink/75 mt-1">
          {result.address} — это ~{result.distanceKm.toFixed(1)} км от пиццерии.
          Сюда доставка пока не возит, но можно оформить самовывоз.
        </p>
      </div>
    );
  }
  const z = result.zone!;
  return (
    <div className="mt-3 border-2 border-ink bg-cream p-3 shadow-[4px_4px_0_var(--ink)]">
      <div className="flex items-center gap-2">
        <span
          className="w-3.5 h-3.5 rounded-full border-2 border-ink shrink-0"
          style={{ background: z.color }}
        />
        <span className="font-display uppercase text-sm">
          {z.name} · доставка {formatRub(z.price)}
        </span>
      </div>
      <p className="text-[13px] text-ink/75 mt-1.5">{result.address}</p>
      <p className="text-[13px] mt-1">
        Минимальный заказ — <b>{formatRub(z.minOrder)}</b>. Бесплатная доставка от{" "}
        {formatRub(FREE_DELIVERY_FROM)}.
      </p>
    </div>
  );
}

function ZoneLegend() {
  return (
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
      {DELIVERY_ZONES.map((z) => (
        <div key={z.id} className="flex items-center gap-2 text-[12px]">
          <span
            className="w-3 h-3 rounded-full border-2 border-ink shrink-0"
            style={{ background: z.color }}
          />
          <span className="font-display uppercase tracking-wide">{z.name}</span>
          <span className="text-smoke">
            до {z.maxRadiusKm} км · {formatRub(z.price)} · мин. {formatRub(z.minOrder)}
          </span>
        </div>
      ))}
    </div>
  );
}
