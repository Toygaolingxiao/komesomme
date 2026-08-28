/**
 * Best-effort sliding-window limiter for serverless.
 *
 * Counters live in the isolate memory, so limits are per instance — still useful
 * against casual abuse on a public Vercel URL. Pair with SEMANTIC_RECOMMEND_ENABLED
 * as a hard kill switch. Upgrade to Upstash/Redis when traffic grows.
 */

type Bucket = {
  timestamps: number[];
};

const buckets = new Map<string, Bucket>();

function prune(timestamps: number[], windowMs: number, now: number) {
  const floor = now - windowMs;
  let i = 0;
  while (i < timestamps.length && timestamps[i]! < floor) i += 1;
  if (i > 0) timestamps.splice(0, i);
}

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number };

export function takeToken(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  if (limit <= 0) return { ok: true, remaining: Number.POSITIVE_INFINITY };

  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }

  prune(bucket.timestamps, windowMs, now);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { ok: false, retryAfterSec };
  }

  bucket.timestamps.push(now);
  return { ok: true, remaining: Math.max(0, limit - bucket.timestamps.length) };
}

/** Bound map growth in long-lived dev servers. */
export function sweepStaleBuckets(maxAgeMs = 24 * 60 * 60 * 1000) {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    prune(bucket.timestamps, maxAgeMs, now);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
}
