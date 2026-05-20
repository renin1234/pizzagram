import { NextResponse } from "next/server";
import { KRASNODAR_BOUNDS } from "@/lib/delivery-zones";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Геокодер адресов Pizzagram.
 *
 * Раньше адрес искался через ymaps.geocode() прямо в браузере, но ключ
 * «JavaScript API» не даёт доступа к геокодеру Яндекса — каждый запрос падал
 * с ошибкой. Этот серверный маршрут ходит в OpenStreetMap Nominatim, который
 * не требует ключа, и работает независимо от карты.
 *
 *   GET /api/geocode?q=улица+дом      → { results: [{ address, coords }] }
 *   GET /api/geocode?lat=..&lon=..    → { address }
 */

export const dynamic = "force-dynamic";

// KRASNODAR_BOUNDS = [[latMin, lonMin], [latMax, lonMax]].
const [[latMin, lonMin], [latMax, lonMax]] = KRASNODAR_BOUNDS;
// Nominatim viewbox принимает углы как «lon,lat,lon,lat».
const VIEWBOX = `${lonMin},${latMax},${lonMax},${latMin}`;

// Nominatim требует осмысленный User-Agent, иначе блокирует запросы.
const USER_AGENT = "Pizzagram-Krasnodar/1.0 (delivery zone calculator)";

type GeoHit = { address: string; coords: [number, number] };

/** Собирает короткий читаемый адрес из ответа Nominatim. */
function labelFrom(item: any): string {
  const a = item?.address ?? {};
  const street =
    a.road || a.pedestrian || a.footway || a.residential || a.neighbourhood || "";
  const house = a.house_number || "";
  const city =
    a.city || a.town || a.village || a.municipality || a.county || "";
  const head = street ? (house ? `${street}, ${house}` : street) : item?.name || "";
  const line = [head, city].filter(Boolean).join(", ");
  return line || item?.display_name || "";
}

/** Запрос к Nominatim с таймаутом. */
async function nominatim(
  path: "search" | "reverse",
  params: Record<string, string>,
): Promise<any> {
  const url = new URL(`https://nominatim.openstreetmap.org/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "ru" },
      signal: ctrl.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`nominatim ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Поиск адреса: сначала строго по Краснодару, затем — шире, если ничего нет. */
async function searchAddress(q: string, limit: string): Promise<any[]> {
  const base: Record<string, string> = {
    format: "jsonv2",
    q,
    addressdetails: "1",
    limit,
    countrycodes: "ru",
    "accept-language": "ru",
  };
  let data = await nominatim("search", { ...base, viewbox: VIEWBOX, bounded: "1" });
  if (!Array.isArray(data) || data.length === 0) {
    data = await nominatim("search", { ...base, viewbox: VIEWBOX });
  }
  return Array.isArray(data) ? data : [];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  try {
    // Обратное геокодирование: координаты → адрес.
    if (lat && lon) {
      const data = await nominatim("reverse", {
        format: "jsonv2",
        lat,
        lon,
        addressdetails: "1",
        zoom: "18",
        "accept-language": "ru",
      });
      const address =
        labelFrom(data) ||
        `${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)}`;
      return NextResponse.json({ address });
    }

    // Прямое геокодирование: текст → координаты.
    if (q) {
      const limit = searchParams.get("limit") || "5";
      const raw = await searchAddress(q, limit);
      const results: GeoHit[] = raw
        .map((it): GeoHit | null => {
          const latNum = parseFloat(it.lat);
          const lonNum = parseFloat(it.lon);
          if (Number.isNaN(latNum) || Number.isNaN(lonNum)) return null;
          return { address: labelFrom(it), coords: [latNum, lonNum] };
        })
        .filter((r): r is GeoHit => r !== null);
      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: "no query" }, { status: 400 });
  } catch (err) {
    console.error("geocode failed:", err);
    return NextResponse.json({ error: "geocode failed" }, { status: 502 });
  }
}
