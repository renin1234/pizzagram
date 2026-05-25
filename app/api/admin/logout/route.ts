import { clearAdminCookie } from "@/lib/admin-session";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const loginUrl = new URL("/admin/login", req.url);
  return NextResponse.redirect(loginUrl, {
    status: 303,
    headers: { "Set-Cookie": clearAdminCookie() },
  });
}
