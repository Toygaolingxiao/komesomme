import { NextResponse } from "next/server";
import {
  loadYahooAffiliateSheet,
  saveYahooAffiliateRow,
  syncYahooAffiliateBrandRows,
} from "@/lib/affiliate/yahooPromo";
import { opsDashboardConfigured } from "@/lib/ops/auth";
import { hasValidOpsSession } from "@/lib/ops/session";
import { clientIpFromRequest } from "@/lib/security/clientIp";
import { takeToken } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

const MINUTE_MS = 60_000;

function gate() {
  if (!opsDashboardConfigured()) {
    return NextResponse.json({ message: "not found" }, { status: 404 });
  }
  return null;
}

async function requireSession() {
  if (!(await hasValidOpsSession())) {
    return NextResponse.json({ message: "unauthorized" }, { status: 401 });
  }
  return null;
}

function rateLimit(request: Request, key: string, limit: number) {
  const ip = clientIpFromRequest(request);
  const result = takeToken(`${key}:${ip}`, limit, MINUTE_MS);
  if (!result.ok) {
    return NextResponse.json(
      { message: "too many requests" },
      { status: 429, headers: { "Retry-After": String(result.retryAfterSec) } },
    );
  }
  return null;
}

function asTableError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : "unavailable";
  if (message === "table missing" || /does not exist|schema cache/i.test(message)) {
    return NextResponse.json({ message: "table missing" }, { status: 409 });
  }
  if (message === "column missing") {
    return NextResponse.json({ message: "column missing" }, { status: 409 });
  }
  if (message === "unknown brand") {
    return NextResponse.json({ message: "unknown brand" }, { status: 404 });
  }
  if (message === "invalid promo url") {
    return NextResponse.json({ message: "invalid promo url" }, { status: 400 });
  }
  console.error("ops yahoo-links:", cause);
  return NextResponse.json({ message: "unavailable" }, { status: 502 });
}

export async function GET(request: Request) {
  const denied = gate() ?? (await requireSession()) ?? rateLimit(request, "ops-yahoo-get", 30);
  if (denied) return denied;

  try {
    const { rows, tableReady } = await loadYahooAffiliateSheet();
    const filled = rows.filter((row) => row.promoUrl).length;
    const noProducts = rows.filter((row) => row.noProducts).length;
    const todo = rows.filter((row) => !row.promoUrl && !row.noProducts).length;
    return NextResponse.json(
      { rows, tableReady, filled, noProducts, todo, total: rows.length },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (cause) {
    return asTableError(cause);
  }
}

export async function POST(request: Request) {
  const denied = gate() ?? (await requireSession()) ?? rateLimit(request, "ops-yahoo-sync", 10);
  if (denied) return denied;

  try {
    const result = await syncYahooAffiliateBrandRows();
    const { rows } = await loadYahooAffiliateSheet();
    return NextResponse.json(
      { ...result, rows },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (cause) {
    return asTableError(cause);
  }
}

export async function PATCH(request: Request) {
  const denied = gate() ?? (await requireSession()) ?? rateLimit(request, "ops-yahoo-patch", 40);
  if (denied) return denied;

  let body: { brandId?: unknown; promoUrl?: unknown; noProducts?: unknown };
  try {
    body = (await request.json()) as {
      brandId?: unknown;
      promoUrl?: unknown;
      noProducts?: unknown;
    };
  } catch {
    return NextResponse.json({ message: "invalid json" }, { status: 400 });
  }

  const brandId = typeof body.brandId === "string" ? body.brandId.trim() : "";
  if (!brandId) {
    return NextResponse.json({ message: "brandId required" }, { status: 400 });
  }

  const patch: { promoUrl?: string; noProducts?: boolean } = {};
  if (typeof body.promoUrl === "string") patch.promoUrl = body.promoUrl;
  if (typeof body.noProducts === "boolean") patch.noProducts = body.noProducts;
  if (patch.promoUrl === undefined && patch.noProducts === undefined) {
    return NextResponse.json({ message: "nothing to update" }, { status: 400 });
  }

  try {
    const row = await saveYahooAffiliateRow(brandId, patch);
    return NextResponse.json({ row }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (cause) {
    return asTableError(cause);
  }
}
