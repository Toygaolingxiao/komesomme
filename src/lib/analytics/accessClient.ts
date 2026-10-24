import { readLandingAttribution } from "@/lib/analytics/attribution";
import { isOpsPath } from "@/lib/ops/paths";

const SESSION_KEY = "km_sid";

function sessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return "anon";
  }
}

function cleanPath(path: string): string {
  const bare = path.split("?")[0]?.split("#")[0] ?? "/";
  return bare.slice(0, 200);
}

/** Fire-and-forget POST to our access log. Never throws to callers. */
export function recordAccess(
  event: string,
  meta: Record<string, string | number | boolean | null | undefined> = {},
  path?: string
) {
  if (typeof window === "undefined") return;
  const resolved = cleanPath(path ?? window.location.pathname);
  if (isOpsPath(resolved)) return;

  const body = JSON.stringify({
    event: event.slice(0, 64),
    path: resolved,
    sessionId: sessionId(),
    // First-touch utm_* / referrer. Caller fields stay if they use the same key.
    meta: { ...readLandingAttribution(), ...meta },
  });

  try {
    void fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      /* ignore */
    });
  } catch {
    /* ignore */
  }
}
