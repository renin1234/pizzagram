/**
 * Security regression: session cookie flags.
 *
 * Verifies that in production the Set-Cookie header includes Secure, HttpOnly,
 * and SameSite=Lax so the session JWT cannot be transmitted over plain HTTP
 * or read by JavaScript.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { buildSessionCookie, clearSessionCookie } from "@/lib/session";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("buildSessionCookie — production security flags", () => {
  it("includes Secure in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const cookie = buildSessionCookie("test-token");
    expect(cookie).toContain("Secure");
  });

  it("includes HttpOnly in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const cookie = buildSessionCookie("test-token");
    expect(cookie).toContain("HttpOnly");
  });

  it("includes SameSite=Lax in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const cookie = buildSessionCookie("test-token");
    expect(cookie).toContain("SameSite=Lax");
  });

  it("does NOT include Secure in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const cookie = buildSessionCookie("test-token");
    expect(cookie).not.toContain("Secure");
    // Still requires HttpOnly in dev
    expect(cookie).toContain("HttpOnly");
  });

  it("encodes the token value", () => {
    vi.stubEnv("NODE_ENV", "production");
    const token = "abc.def.ghi";
    const cookie = buildSessionCookie(token);
    // Cookie value must be URL-encoded or at minimum present
    expect(cookie).toContain(token);
  });
});

describe("clearSessionCookie — production security flags", () => {
  it("includes Secure in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const cookie = clearSessionCookie();
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("Max-Age=0");
  });

  it("does NOT include Secure in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    const cookie = clearSessionCookie();
    expect(cookie).not.toContain("Secure");
    expect(cookie).toContain("Max-Age=0");
  });
});
