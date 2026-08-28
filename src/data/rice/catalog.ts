import { riceSources } from "@/data/rice";
import { curatedRiceProfiles } from "@/data/rice/overlay";
import { deriveRiceProfiles } from "@/lib/rice/deriveProfile";
import { dedupeRiceCatalogue } from "@/lib/rice/cultivarDedup";
import type { RiceProfileV2, RiceRegion } from "@/types/rice";

/**
 * Running V2 catalogue.
 *
 * Regional RiceSource files are the scoring and copy source of truth. Overlay
 * entries in `src/data/rice/overlay.ts` only add brands that do not yet
 * exist in those files (trademark representatives, remaining editorial rows).
 * Matching names keep the derived source profile so overlay drafts cannot
 * overwrite prefecture or taste scores.
 */

const ARRAY_FIELDS = [
  "best_match_dishes",
  "good_with",
  "avoid_pairings",
  "spring_pairings",
  "summer_pairings",
  "autumn_pairings",
  "winter_pairings",
  "sake_pairings",
  "beer_pairings",
  "wine_pairings",
  "whisky_pairings",
  "tea_pairings",
  "mood_pairings",
  "occasion_pairings",
  "lifestyle_scenes",
  "semantic_tags",
  "search_queries",
  "furusato_keywords",
] as const satisfies ReadonlyArray<keyof RiceProfileV2>;

const REGION_ALIASES: Record<string, RiceRegion> = {
  "関西・中部": "近畿",
};

const REGIONS: RiceRegion[] = [
  "北海道・東北",
  "関東・甲信越",
  "東海・北陸",
  "近畿",
  "中国・四国",
  "九州・沖縄",
  "全国銘柄",
];

function normalizeName(name: string) {
  return name
    .normalize("NFKC")
    .replace(/[（(][^）)]*[）)]/g, "")
    .replace(/\s+/g, "");
}

function toKebabId(id: string) {
  return id.replace(/_/g, "-").toLowerCase();
}

function asRegion(value: string, fallback: RiceRegion): RiceRegion {
  if (value in REGION_ALIASES) return REGION_ALIASES[value];
  return REGIONS.includes(value as RiceRegion) ? (value as RiceRegion) : fallback;
}

function fillMissingLists(rice: RiceProfileV2): RiceProfileV2 {
  const filled = { ...rice };
  for (const field of ARRAY_FIELDS) {
    const value = filled[field];
    if (!Array.isArray(value) || value.length === 0) {
      filled[field] = ["日常の食卓"];
    }
  }
  return filled;
}

function overlay(base: RiceProfileV2, _curated: RiceProfileV2): RiceProfileV2 {
  return base;
}

/** Last occurrence wins — the file was appended as editorial drafts accumulated. */
function latestCuratedByName() {
  const byName = new Map<string, RiceProfileV2>();
  for (const rice of curatedRiceProfiles) {
    byName.set(normalizeName(rice.name), rice);
  }
  return byName;
}

const derived = deriveRiceProfiles(riceSources);
const curatedByName = latestCuratedByName();
const matchedNames = new Set<string>();

const mergedFromSources: RiceProfileV2[] = derived.map((base) => {
  const key = normalizeName(base.name);
  const curated = curatedByName.get(key);
  if (!curated) return base;

  matchedNames.add(key);
  return overlay(base, curated);
});

const curatedOnly: RiceProfileV2[] = [];
const usedIds = new Set(mergedFromSources.map((rice) => rice.id));

for (const [key, rice] of curatedByName) {
  if (matchedNames.has(key)) continue;
  let id = toKebabId(rice.id);
  if (usedIds.has(id)) id = `${id}-editorial`;
  usedIds.add(id);
  curatedOnly.push(
    fillMissingLists({
      ...rice,
      id,
      region: asRegion(rice.region, "全国銘柄"),
    })
  );
}

export const riceProfiles: RiceProfileV2[] = dedupeRiceCatalogue([
  ...mergedFromSources,
  ...curatedOnly,
]);

export function findRiceProfile(id: string): RiceProfileV2 | undefined {
  return riceProfiles.find((rice) => rice.id === id);
}
