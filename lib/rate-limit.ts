/**
 * Rate limiting with Upstash Redis in production, in-memory fallback in dev.
 *
 * Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in Vercel to enable
 * shared rate limiting across serverless instances. Without those vars the
 * in-memory Map is used (fine for a single local dev process, not for prod).
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback (dev / no Redis configured)
type Entry = { count: number; resetAt: number };
const inMemoryStore = new Map<string, Entry>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of inMemoryStore) if (v.resetAt <= now) inMemoryStore.delete(k);
}, 5 * 60 * 1000).unref?.();

function inMemoryLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = inMemoryStore.get(key);
  if (!entry || entry.resetAt <= now) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  if (entry.count >= maxRequests) {
    return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { ok: true, retryAfterSec: 0 };
}

// Upstash limiters are cached by config key to avoid creating a new instance per request
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(maxRequests: number, windowMs: number): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  const cacheKey = `${maxRequests}:${windowMs}`;
  if (!upstashLimiters.has(cacheKey)) {
    upstashLimiters.set(
      cacheKey,
      new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
        analytics: false,
      }),
    );
  }
  return upstashLimiters.get(cacheKey)!;
}

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ ok: boolean; retryAfterSec: number }> {
  const limiter = getUpstashLimiter(maxRequests, windowMs);
  if (limiter) {
    const { success, reset } = await limiter.limit(key);
    return {
      ok: success,
      retryAfterSec: success ? 0 : Math.ceil(Math.max(0, reset - Date.now()) / 1000),
    };
  }
  return inMemoryLimit(key, maxRequests, windowMs);
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
