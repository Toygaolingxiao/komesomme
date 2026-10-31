import type { RiceProfileV2 } from "@/types/rice";

/**
 * Per-brand full-profile fetches for the home detail panel.
 *
 * The server catalogue is static per deploy, so a module-level Map is
 * enough: once a brand has been opened its profile is never refetched.
 * Failures are not cached — the panel falls back to the map projection
 * for that open and a later open may retry.
 */

const cache = new Map<string, RiceProfileV2>();

export function getCachedRiceProfile(id: string): RiceProfileV2 | null {
  return cache.get(id) ?? null;
}

export async function fetchRiceProfileById(
  id: string
): Promise<RiceProfileV2 | null> {
  const hit = cache.get(id);
  if (hit) return hit;

  try {
    const response = await fetch(
      `/api/rice/profile/${encodeURIComponent(id)}`
    );
    if (!response.ok) return null;
    const body = (await response.json().catch(() => null)) as
      | RiceProfileV2
      | null;
    if (!body || body.id !== id) return null;
    cache.set(id, body);
    return body;
  } catch {
    return null;
  }
}

/** Test hook: the cache is module state, so suites reset it explicitly. */
export function clearRiceProfileCache(): void {
  cache.clear();
}
