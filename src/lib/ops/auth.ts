/**
 * Ops dashboard auth helpers. Web Crypto so Node and tests share one HMAC path.
 * Session checks that need `cookies()` live in `session.ts` (App Router / Node only).
 */

export { isOpsPath, isSafeOpsNextPath } from "@/lib/ops/paths";

export const OPS_COOKIE = "km_ops_session";
export const OPS_SESSION_MAX_AGE_SEC = 60 * 60 * 12; // 12h
export const OPS_SECRET_MIN_LEN = 16;
export const OPS_SECRET_MAX_LEN = 256;

const encoder = new TextEncoder();

export function getOpsDashboardSecret(): string | null {
  const raw = process.env.OPS_DASHBOARD_SECRET?.trim() ?? "";
  if (raw.length < OPS_SECRET_MIN_LEN || raw.length > OPS_SECRET_MAX_LEN) return null;
  return raw;
}

/** When unset or too short, the ops surface must 404 — do not advertise it. */
export function opsDashboardConfigured(): boolean {
  return getOpsDashboardSecret() !== null;
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a[i]! ^ b[i]!;
  return out === 0;
}

async function hmacSha256(secret: string, payload: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const pad = "=".repeat((4 - (value.length % 4)) % 4);
  try {
    const bin = atob(value.replace(/-/g, "+").replace(/_/g, "/") + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

/** Length-independent compare via HMAC-then-bytes. */
export async function secretsMatch(provided: string, expected: string): Promise<boolean> {
  const [left, right] = await Promise.all([
    hmacSha256("km-ops-cmp", provided),
    hmacSha256("km-ops-cmp", expected),
  ]);
  return timingSafeEqualBytes(left, right);
}

export async function createOpsSessionToken(secret: string, now = Date.now()): Promise<string> {
  const payload = String(now + OPS_SESSION_MAX_AGE_SEC * 1000);
  const sig = toBase64Url(await hmacSha256(secret, payload));
  return `${payload}.${sig}`;
}

export async function verifyOpsSessionToken(
  secret: string,
  token: string | undefined | null,
  now = Date.now()
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!/^\d{13,16}$/.test(payload)) return false;
  const exp = Number(payload);
  if (!Number.isFinite(exp) || now > exp) return false;
  const actual = fromBase64Url(sig);
  if (!actual) return false;
  const expected = await hmacSha256(secret, payload);
  return timingSafeEqualBytes(actual, expected);
}

export function opsCookieOptions(maxAge = OPS_SESSION_MAX_AGE_SEC) {
  return {
    httpOnly: true as const,
    // Vercel is always HTTPS. Local `next start` over http must still store the cookie.
    secure: Boolean(process.env.VERCEL),
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}
