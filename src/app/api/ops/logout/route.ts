import { NextResponse } from "next/server";
import { OPS_COOKIE, opsCookieOptions } from "@/lib/ops/auth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(OPS_COOKIE, "", { ...opsCookieOptions(0), maxAge: 0 });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
