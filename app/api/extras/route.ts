import { NextResponse } from "next/server";
import { readExtras } from "@/lib/extras-data";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await readExtras());
}
