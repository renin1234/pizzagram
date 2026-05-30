type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

// Чистим старые записи каждые 5 минут, чтобы не копить память
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store) if (v.resetAt <= now) store.delete(k);
}, 5 * 60 * 1000).unref?.();

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (entry.count >= maxRequests) {
    return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { ok: true, retryAfterSec: 0 };
}

export function getIP(req: Request): string {
  // x-real-ip is harder to spoof than x-forwarded-for.
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // On Vercel the real client IP is appended last by the edge — take the last entry,
  // not the first, which is attacker-controlled via a spoofed header.
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",").map((s) => s.trim()).filter(Boolean);
    return parts[parts.length - 1] ?? "unknown";
  }
  return "unknown";
}
