import { fnv1a, jstDateKey } from "@/lib/editorial/jst";

export type BowlCandidate = {
  id: string;
  region: string;
};

/**
 * Three brands for the Tokyo calendar day.
 * Independent of map-probe distance. Prefers distinct regions, then fills.
 */
export function pickTodaysBowl<T extends BowlCandidate>(
  pool: T[],
  now: Date | number = Date.now(),
  count = 3
): T[] {
  if (pool.length === 0 || count <= 0) return [];

  const key = jstDateKey(now);
  const ranked = [...pool].sort((a, b) => {
    const delta = fnv1a(`${key}:${a.id}`) - fnv1a(`${key}:${b.id}`);
    return delta !== 0 ? delta : a.id.localeCompare(b.id);
  });

  const picked: T[] = [];
  const usedRegions = new Set<string>();

  for (const item of ranked) {
    if (picked.length >= count) break;
    if (usedRegions.has(item.region)) continue;
    usedRegions.add(item.region);
    picked.push(item);
  }

  for (const item of ranked) {
    if (picked.length >= count) break;
    if (picked.some((row) => row.id === item.id)) continue;
    picked.push(item);
  }

  return picked;
}
