/**
 * Security regression: YooKassa configuration guard.
 *
 * /api/payment must return 503 (not a simulated ok:true) when
 * YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY are absent.
 * A simulated success would let a user think their order is paid
 * while actually no payment was processed.
 */
import { describe, it, expect, vi, afterEach } from "vitest";

// Mock all server-side I/O so the route can be imported in test context.
vi.mock("@/lib/menu-data", () => ({ readMenu: vi.fn().mockResolvedValue([]) }));
vi.mock("@/lib/extras-data", () => ({
  readExtras: vi.fn().mockResolvedValue({ extras: [], sauces: [] }),
}));
vi.mock("@/lib/db", () => ({ sql: vi.fn().mockResolvedValue([]) }));
vi.mock("@/lib/telegram", () => ({
  buildOrderMessage: vi.fn().mockReturnValue(""),
  sendToTelegram: vi.fn().mockResolvedValue({ sent: true }),
}));
vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn().mockReturnValue({ ok: true, retryAfterSec: 0 }),
  getIP: vi.fn().mockReturnValue("127.0.0.1"),
}));
vi.mock("@/lib/session", () => ({
  getSessionFromRequest: vi.fn().mockResolvedValue(null),
}));

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("/api/payment — YooKassa config guard", () => {
  it("returns 503 when YOOKASSA_SHOP_ID is absent", async () => {
    vi.stubEnv("YOOKASSA_SHOP_ID", "");
    vi.stubEnv("YOOKASSA_SECRET_KEY", "");

    const { POST } = await import("@/app/api/payment/route");

    const body = JSON.stringify({
      name: "Тест",
      phone: "+79001234567",
      address: "ул. Тестовая, 1",
      method: "delivery",
      payment: "online",
      lines: [],
      subtotal: 0,
      discount: 0,
      total: 500,
    });

    const req = new Request("https://example.com/api/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const res = await POST(req);
    expect(res.status).toBe(503);

    const json = await res.json();
    // Must NOT contain simulated:true — that was the vulnerable behaviour
    expect(json).not.toHaveProperty("simulated");
    expect(json).toHaveProperty("error");
  });
});
