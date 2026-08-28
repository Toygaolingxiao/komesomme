import { NextResponse } from "next/server";
import { clientIpFromRequest } from "./clientIp";
import { sweepStaleBuckets, takeToken } from "./rateLimit";

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * 60_000;

function envFlag(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return !["0", "false", "off", "no"].includes(raw.trim().toLowerCase());
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** When false, consultation API returns 503 without calling providers. */
export function isSemanticRecommendEnabled(): boolean {
  return envFlag("SEMANTIC_RECOMMEND_ENABLED", true);
}

export function semanticRateLimits() {
  return {
    perMinute: envInt("SEMANTIC_RATE_LIMIT_PER_MIN", 8),
    perDay: envInt("SEMANTIC_RATE_LIMIT_PER_DAY", 80),
  };
}

/**
 * Kill switch + per-IP rate limits. Returns a Response to short-circuit, or null.
 */
export function guardSemanticRecommend(request: Request): NextResponse | null {
  if (!isSemanticRecommendEnabled()) {
    return NextResponse.json(
      {
        message:
          "ただいま相談を一時停止しています。味わいの地図から銘柄を探してみてください。",
      },
      { status: 503 }
    );
  }

  const ip = clientIpFromRequest(request);
  const { perMinute, perDay } = semanticRateLimits();

  // Occasional cleanup so the Map does not grow without bound in long processes.
  if (Math.random() < 0.01) sweepStaleBuckets();

  const minute = takeToken(`sem:m:${ip}`, perMinute, MINUTE_MS);
  if (!minute.ok) {
    return NextResponse.json(
      {
        message:
          "相談が混み合っています。しばらくしてから、もう一度お試しください。",
      },
      {
        status: 429,
        headers: { "Retry-After": String(minute.retryAfterSec) },
      }
    );
  }

  const day = takeToken(`sem:d:${ip}`, perDay, DAY_MS);
  if (!day.ok) {
    return NextResponse.json(
      {
        message:
          "本日の相談回数の上限に達しました。味わいの地図から銘柄を探してみてください。",
      },
      {
        status: 429,
        headers: { "Retry-After": String(day.retryAfterSec) },
      }
    );
  }

  return null;
}
