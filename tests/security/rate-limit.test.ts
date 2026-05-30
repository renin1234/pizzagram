/**
 * Security regression: IP extraction.
 *
 * Confirms that getIP() uses the last (Vercel-appended) XFF entry and
 * cannot be trivially bypassed by a spoofed X-Forwarded-For header.
 */
import { describe, it, expect } from "vitest";
import { getIP } from "@/lib/rate-limit";

function makeRequest(headers: Record<string, string>): Request {
  return new Request("https://example.com/api/test", { headers });
}

describe("getIP — IP extraction", () => {
  it("prefers x-real-ip over x-forwarded-for", () => {
    const req = makeRequest({
      "x-real-ip": "1.2.3.4",
      "x-forwarded-for": "9.9.9.9, 8.8.8.8",
    });
    expect(getIP(req)).toBe("1.2.3.4");
  });

  it("uses the LAST XFF entry (Vercel-appended real IP), not the first", () => {
    // Attacker sets the first entry; Vercel appends the real IP at the end
    const req = makeRequest({
      "x-forwarded-for": "1.1.1.1, 2.2.2.2, 3.3.3.3", // 3.3.3.3 = real
    });
    expect(getIP(req)).toBe("3.3.3.3");
  });

  it("does NOT return the attacker-controlled first XFF entry", () => {
    const req = makeRequest({
      "x-forwarded-for": "attacker-spoofed-ip, 5.5.5.5",
    });
    const ip = getIP(req);
    expect(ip).not.toBe("attacker-spoofed-ip");
    expect(ip).toBe("5.5.5.5");
  });

  it("handles single-entry XFF correctly", () => {
    const req = makeRequest({ "x-forwarded-for": "4.4.4.4" });
    expect(getIP(req)).toBe("4.4.4.4");
  });

  it("returns 'unknown' when no IP headers present", () => {
    const req = makeRequest({});
    expect(getIP(req)).toBe("unknown");
  });

  it("trims whitespace from extracted IP", () => {
    const req = makeRequest({ "x-forwarded-for": "  6.6.6.6  ,  7.7.7.7  " });
    expect(getIP(req)).toBe("7.7.7.7");
  });
});
