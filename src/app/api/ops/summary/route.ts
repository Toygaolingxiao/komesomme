import { NextResponse } from "next/server";
import { loadOpsSummary } from "@/lib/ops/loadSummary";
import { opsDashboardConfigured } from "@/lib/ops/auth";
import { hasValidOpsSession } from "@/lib/ops/session";
import { clientIpFromRequest } from "@/lib/security/clientIp";
import { takeToken } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

const MINUTE_MS = 60_000;

/**
 * Cookie-gated JSON for the ops dashboard.
 * Session is verified here (Node), not in Edge middleware.
 */
export async function GET(request: Request) {
  if (!opsDashboardConfigured()) {
    return NextResponse.json({ message: "not found" }, { status: 404 });
  }
  if (!(await hasValidOpsSession())) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }

  const ip = clientIpFromRequest(request);
  const gate = takeToken(`ops-summary:${ip}`, 30, MINUTE_MS);
  if (!gate.ok) {
    return NextResponse.json(
      { message: "too many requests" },
      { status: 429, headers: { "Retry-After": String(gate.retryAfterSec) } }
    );
  }

  const range = new URL(request.url).searchParams.get("range");
  try {
    const summary = await loadOpsSummary(range);
    return NextResponse.json(summary, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (cause) {
    console.error("ops summary failed:", cause);
    return NextResponse.json({ message: "summary unavailable" }, { status: 502 });
  }
}
