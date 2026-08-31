import { NextResponse } from "next/server";
import { isLocalAnalyticsHost, requestHost } from "@/lib/analytics/recordPolicy";
import { hasValidOpsSession } from "@/lib/ops/session";
import { clientIpFromRequest } from "@/lib/security/clientIp";
import { sweepStaleBuckets, takeToken } from "@/lib/security/rateLimit";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const MINUTE_MS = 60_000;
const MAX_META_KEYS = 12;
const MAX_META_STRING = 120;

function analyticsEnabled() {
  const raw = process.env.ACCESS_LOG_ENABLED;
  if (raw === undefined || raw === "") return true;
  return !["0", "false", "off", "no"].includes(raw.trim().toLowerCase());
}

function sanitizeMeta(input: unknown): Record<string, string | number | boolean | null> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (Object.keys(out).length >= MAX_META_KEYS) break;
    const safeKey = key.slice(0, 40);
    if (value === null || typeof value === "boolean" || typeof value === "number") {
      out[safeKey] = value as string | number | boolean | null;
      continue;
    }
    if (typeof value === "string") {
      out[safeKey] = value.slice(0, MAX_META_STRING);
    }
  }
  return out;
}

/**
 * Accepts anonymous product events from the browser.
 * Stores via service role; never returns stored rows.
 */
export async function POST(request: Request) {
  if (!analyticsEnabled()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (isLocalAnalyticsHost(requestHost(request))) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (process.env.VERCEL_ENV === "preview") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (await hasValidOpsSession()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const ip = clientIpFromRequest(request);
  if (Math.random() < 0.02) sweepStaleBuckets();
  const gate = takeToken(`access:${ip}`, 60, MINUTE_MS);
  if (!gate.ok) {
    return NextResponse.json(
      { message: "too many requests" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } }
    );
  }

  let event: string;
  let path: string | null = null;
  let sessionId: string | null = null;
  let meta: Record<string, string | number | boolean | null> = {};

  try {
    const body = (await request.json()) as {
      event?: unknown;
      path?: unknown;
      sessionId?: unknown;
      meta?: unknown;
    };
    if (typeof body.event !== "string" || !body.event.trim()) {
      return NextResponse.json({ message: "event required" }, { status: 400 });
    }
    event = body.event.trim().slice(0, 64);
    if (typeof body.path === "string") path = body.path.trim().slice(0, 200) || null;
    if (typeof body.sessionId === "string") {
      sessionId = body.sessionId.trim().slice(0, 80) || null;
    }
    meta = sanitizeMeta(body.meta);
  } catch {
    return NextResponse.json({ message: "invalid json" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("access_events").insert({
      event,
      path,
      session_id: sessionId,
      meta,
    } as never);
    if (error) {
      console.error("access_events insert failed:", error.message);
      return NextResponse.json({ message: "store failed" }, { status: 502 });
    }
  } catch (cause) {
    console.error("access_events unavailable:", cause);
    return NextResponse.json({ message: "store failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
