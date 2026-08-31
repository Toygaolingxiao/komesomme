import { NextResponse } from "next/server";
import {
  createOpsSessionToken,
  getOpsDashboardSecret,
  opsCookieOptions,
  OPS_COOKIE,
  OPS_SECRET_MAX_LEN,
  opsDashboardConfigured,
  secretsMatch,
} from "@/lib/ops/auth";
import { clientIpFromRequest } from "@/lib/security/clientIp";
import { takeToken } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

const MINUTE_MS = 60_000;

export async function POST(request: Request) {
  if (!opsDashboardConfigured()) {
    return NextResponse.json({ message: "not found" }, { status: 404 });
  }

  const secret = getOpsDashboardSecret();
  if (!secret) {
    return NextResponse.json({ message: "not found" }, { status: 404 });
  }

  const ip = clientIpFromRequest(request);
  const gate = takeToken(`ops-login:${ip}`, 10, MINUTE_MS);
  if (!gate.ok) {
    return NextResponse.json(
      { message: "too many requests" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } }
    );
  }

  let provided = "";
  try {
    const body = (await request.json()) as { secret?: unknown };
    if (typeof body.secret === "string") provided = body.secret;
  } catch {
    return NextResponse.json({ message: "invalid json" }, { status: 400 });
  }

  if (provided.length > OPS_SECRET_MAX_LEN || !(await secretsMatch(provided, secret))) {
    return NextResponse.json({ message: "invalid credentials" }, { status: 401 });
  }

  const token = await createOpsSessionToken(secret);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(OPS_COOKIE, token, opsCookieOptions());
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
