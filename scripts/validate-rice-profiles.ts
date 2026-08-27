import { riceProfiles } from "../src/data/riceProfilesV2";
import { buildRiceSearchText } from "../src/lib/rice/buildRiceSearchText";
import type { RiceProfileV2 } from "../src/types/rice";

/**
 * Guards the catalogue before it reaches the embedding step.
 *
 * A malformed profile is expensive to catch later: it would be embedded, seeded and
 * only surface as a broken card in the UI, so every acceptance criterion is enforced
 * here instead.
 */

const MIN_PROFILE_COUNT = 80;

const SCORE_FIELDS: Array<keyof RiceProfileV2> = [
  "sweetness",
  "hardness",
  "stickiness",
  "aroma",
  "umami",
  "aftertaste",
  "grain_size",
  "clarity",
  "richness",
  "cold_rice_quality",
  "sauce_absorption",
  "oil_compatibility",
];

const REQUIRED_ARRAYS: Array<keyof RiceProfileV2> = [
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
];

const REQUIRED_TEXTS: Array<keyof RiceProfileV2> = [
  "id",
  "name",
  "prefecture",
  "region",
  "quadrant",
  "texture_label",
  "sweetness_label",
  "short_",
  "description",
  "sommelier_note",
  "pairing_reason",
  "rakuten_search_keyword",
];

/** Marketing superlatives banned by the editorial guidelines (docs/ui_design.md). */
const BANNED_WORDS = [
  "最強",
  "圧倒的",
  "究極",
  "唯一無二",
  "爆発",
  "神",
  "無敵",
  "他の追随を許さない",
];

const TEXT_FIELDS_TO_SCAN: Array<keyof RiceProfileV2> = [
  "short_",
  "description",
  "sommelier_note",
  "pairing_reason",
];

const errors: string[] = [];
const warnings: string[] = [];

function fail(message: string) {
  errors.push(message);
}

if (riceProfiles.length < MIN_PROFILE_COUNT) {
  fail(
    `Expected at least ${MIN_PROFILE_COUNT} profiles, found ${riceProfiles.length}.`
  );
}

const seenIds = new Set<string>();
const seenNames = new Set<string>();

for (const rice of riceProfiles) {
  const label = rice.name || rice.id || "(unnamed)";

  if (seenIds.has(rice.id)) {
    fail(`Duplicate id: ${rice.id}`);
  }
  seenIds.add(rice.id);

  if (seenNames.has(rice.name)) {
    fail(`Duplicate name: ${rice.name}`);
  }
  seenNames.add(rice.name);

  if (!/^[a-z0-9-]+$/.test(rice.id)) {
    fail(`${label}: id must be lowercase kebab-case, got "${rice.id}"`);
  }

  for (const field of SCORE_FIELDS) {
    const value = rice[field];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      fail(`${label}: ${String(field)} is not a number`);
      continue;
    }
    if (value < 1 || value > 5) {
      fail(`${label}: ${String(field)} out of range (${value})`);
    }
  }

  for (const field of REQUIRED_ARRAYS) {
    const value = rice[field];
    if (!Array.isArray(value) || value.length === 0) {
      fail(`${label}: ${String(field)} must contain at least one entry`);
      continue;
    }
    if (value.some((item) => typeof item !== "string" || !item.trim())) {
      fail(`${label}: ${String(field)} contains an empty entry`);
    }
  }

  for (const field of REQUIRED_TEXTS) {
    const value = rice[field];
    if (typeof value !== "string" || !value.trim()) {
      fail(`${label}: ${String(field)} must not be empty`);
    }
  }

  for (const field of TEXT_FIELDS_TO_SCAN) {
    const value = String(rice[field] ?? "");
    for (const word of BANNED_WORDS) {
      if (value.includes(word)) {
        warnings.push(`${label}: ${String(field)} contains banned wording "${word}"`);
      }
    }
  }

  const searchText = buildRiceSearchText(rice);
  if (!searchText.trim()) {
    fail(`${label}: buildRiceSearchText produced empty output`);
  } else if (searchText.length < 120) {
    warnings.push(`${label}: search_text is short (${searchText.length} chars)`);
  }
}

const regionCounts = new Map<string, number>();
for (const rice of riceProfiles) {
  regionCounts.set(rice.region, (regionCounts.get(rice.region) ?? 0) + 1);
}

const quadrantCounts = new Map<string, number>();
for (const rice of riceProfiles) {
  quadrantCounts.set(rice.quadrant, (quadrantCounts.get(rice.quadrant) ?? 0) + 1);
}

// An empty quadrant would leave a dead zone on the map where nothing can be recommended.
for (const [quadrant, count] of quadrantCounts) {
  if (count < 3) {
    warnings.push(`Quadrant "${quadrant}" only has ${count} brands`);
  }
}

console.log(`\nRiceProfile V2 validation`);
console.log(`  profiles: ${riceProfiles.length}`);
console.log(`  quadrants: ${quadrantCounts.size}`);
const giRows = riceProfiles.filter((rice) =>
  ["koshihikari-uonuma", "koshihikari-sado", "nitamai", "ryu-no-hitomi"].includes(
    rice.id
  )
);
for (const rice of giRows) {
  console.log(`    GI ${rice.id}: ${rice.name} (${rice.prefecture})`);
}

const requiredGi = ["koshihikari-uonuma", "koshihikari-sado", "nitamai", "ryu-no-hitomi"];
const missingGi = requiredGi.filter((id) => !riceProfiles.some((rice) => rice.id === id));
if (missingGi.length > 0) {
  fail(`Missing GI / premium ids: ${missingGi.join(", ")}`);
}
const genericKoshi = riceProfiles.filter((rice) => rice.id === "koshihikari-bl");
if (genericKoshi.length !== 1) {
  fail(`Expected one generic コシヒカリ (koshihikari-bl), found ${genericKoshi.length}`);
}
for (const [region, count] of [...regionCounts].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${region}: ${count}`);
}

if (warnings.length > 0) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const warning of warnings) {
    console.log(`  - ${warning}`);
  }
}

if (errors.length > 0) {
  console.error(`\n${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log(`\nAll checks passed.\n`);
