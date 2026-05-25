import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/admin-session";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  if (!(await getAdminSessionFromRequest(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*, users(phone, name)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("admin orders fetch error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // Normalize Supabase join: users can be object, null, or array depending on FK resolution
  const orders = (data ?? []).map((o) => ({
    ...o,
    users: Array.isArray(o.users) ? (o.users[0] ?? null) : o.users,
  }));

  return NextResponse.json({ orders });
}
