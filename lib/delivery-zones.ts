/**
 * Зоны доставки Pizzagram и геологика расчёта стоимости.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  ⚠️  ТАРИФЫ-ЗАГЛУШКА. Замените цифры в DELIVERY_ZONES и           │
 * │      FREE_DELIVERY_FROM на реальные — карта, калькулятор и        │
 * │      корзина подхватят их автоматически.                         │
 * └─────────────────────────────────────────────────────────────────┘
 */

/** Координаты пиццерии (ул. Красных Партизан, 1/4 к.8) — [широта, долгота]. */
export const PIZZERIA_COORDS: [number, number] = [45.078741, 38.897977];

export type DeliveryZone = {
  id: number;
  name: string;
  /** Внешний радиус зоны от пиццерии, км. */
  maxRadiusKm: number;
  /** Стоимость доставки, ₽. */
  price: number;
  /** Минимальная сумма заказа для этой зоны, ₽. */
  minOrder: number;
  /** Цвет круга зоны на карте. */
  color: string;
};

/**
 * ⚠️ ЗАГЛУШКА — замените на реальные тарифы.
 * Зоны должны идти по возрастанию радиуса.
 */
export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: 1, name: "Зона 1", maxRadiusKm: 3, price: 149, minOrder: 0, color: "#3DA35D" },
  { id: 2, name: "Зона 2", maxRadiusKm: 6, price: 249, minOrder: 0, color: "#E8A33D" },
  { id: 3, name: "Зона 3", maxRadiusKm: 9, price: 349, minOrder: 0, color: "#FF4D39" },
];

/** ⚠️ ЗАГЛУШКА — сумма заказа, начиная с которой доставка бесплатна. */
export const FREE_DELIVERY_FROM = 1500;

/** Самый дальний радиус доставки, км. Дальше — «вне зоны». */
export const MAX_DELIVERY_RADIUS_KM = DELIVERY_ZONES.reduce(
  (m, z) => Math.max(m, z.maxRadiusKm),
  0,
);

/** Примерные границы Краснодара — для подсказок адреса и геокодера. */
export const KRASNODAR_BOUNDS: [[number, number], [number, number]] = [
  [44.95, 38.78],
  [45.18, 39.17],
];

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Расстояние между точками [широта, долгота] по формуле гаверсинусов, км. */
export function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export type ZoneResult = {
  zone: DeliveryZone | null;
  distanceKm: number;
  deliverable: boolean;
};

/** Определяет зону доставки по координатам точки. */
export function resolveZone(coords: [number, number]): ZoneResult {
  const d = distanceKm(PIZZERIA_COORDS, coords);
  const zone =
    [...DELIVERY_ZONES]
      .sort((a, b) => a.maxRadiusKm - b.maxRadiusKm)
      .find((z) => d <= z.maxRadiusKm) ?? null;
  return { zone, distanceKm: d, deliverable: zone !== null };
}

/** Стоимость доставки с учётом порога бесплатной доставки. */
export function deliveryCost(zone: DeliveryZone | null, goodsTotal: number): number {
  if (!zone) return 0;
  if (goodsTotal >= FREE_DELIVERY_FROM) return 0;
  return zone.price;
}
