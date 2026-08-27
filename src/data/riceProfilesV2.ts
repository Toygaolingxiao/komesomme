import { riceSources } from "@/data/rice";
import { curatedRiceProfiles } from "@/lib/data/riceProfilesv2";
import { deriveRiceProfiles } from "@/lib/rice/deriveProfile";
import type { RiceProfileV2, RiceRegion } from "@/types/rice";

/**
 * Running V2 catalogue.
 *
 * Hand-curated entries in `src/lib/data/riceProfilesv2.ts` win on matching brand
 * names (editorial copy, scores, pairings). Empty curated fields fall back to the
 * derived profile so incomplete drafts still validate. Brands that exist only in
 * the regional RiceSource files remain derived.
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

const TEXT_FIELDS = [
  "short_",
  "description",
  "sommelier_note",
  "pairing_reason",
  "quadrant",
  "texture_label",
  "sweetness_label",
  "rakuten_search_keyword",
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
    .replace(/[（）]/g, (char) => (char === "（" ? "(" : ")"))
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

function overlay(base: RiceProfileV2, curated: RiceProfileV2): RiceProfileV2 {
  const merged: RiceProfileV2 = {
    ...base,
    ...curated,
    id: base.id,
    region: base.region,
    prefecture: curated.prefecture || base.prefecture,
  };

  for (const field of ARRAY_FIELDS) {
    const value = merged[field];
    if (!Array.isArray(value) || value.length === 0) {
      merged[field] = [...(base[field] ?? [])];
    }
  }

  for (const field of TEXT_FIELDS) {
    const value = merged[field];
    if (typeof value !== "string" || !value.trim()) {
      merged[field] = base[field];
    }
  }

  return merged;
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

export const riceProfiles: RiceProfileV2[] = [...mergedFromSources, ...curatedOnly];

export function findRiceProfile(id: string): RiceProfileV2 | undefined {
  return riceProfiles.find((rice) => rice.id === id);
}
