/**
 * JWT helpers for the admin session cookie.
 * Signs with ADMIN_JWT_SECRET (separate from ADMIN_PASSWORD).
 * In development without ADMIN_JWT_SECRET, falls back to ADMIN_PASSWORD-derived key.
 * Cookie name: admin_session, lifetime: 8 hours.
 */
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

function getSecret(): Uint8Array {
  const jwtSecret = process.env.ADMIN_JWT_SECRET;
  if (jwtSecret) return new TextEncoder().encode(jwtSecret);

  // In production, ADMIN_JWT_SECRET is required — sharing it with ADMIN_PASSWORD
  // means a leaked password also compromises all existing sessions.
  if (process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_JWT_SECRET must be set in production (separate from ADMIN_PASSWORD)");
  }

  // Dev fallback: derive from ADMIN_PASSWORD so local dev works without extra setup.
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) throw new Error("ADMIN_PASSWORD или ADMIN_JWT_SECRET не заданы");
  return new TextEncoder().encode(pw + ":admin_jwt_v1");
}

export async function signAdminSession(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function verifyAdminSession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

/** Reads admin_session cookie from an incoming API Request. */
export async function getAdminSessionFromRequest(req: Request): Promise<boolean> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`)
  );
  if (!match) return false;
  return verifyAdminSession(decodeURIComponent(match[1]));
}

export function buildAdminCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}${secure}`;
}

export function clearAdminCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`;
}
