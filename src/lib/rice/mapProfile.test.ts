import { describe, expect, it } from "vitest";
import { riceProfiles } from "@/data/rice/catalog";
import {
  calculateTasteNeighbours,
  calculateTopCoordinateMatches,
  toDisplayPoints,
} from "@/lib/rice/matrix";
import { expandMapProfile, toMapProfile, toMapProfiles } from "./mapProfile";

const MAP_KEYS = [
  "id",
  "name",
  "prefecture",
  "region",
  "region_id",
  "region_color",
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
  "texture_label",
  "sweetness_label",
  "short_",
  "best_match_dishes",
  "good_with",
  "rakuten_search_keyword",
  "amazon_search_keyword",
  "furusato_keywords",
].sort();

describe("toMapProfile", () => {
  it("keeps exactly the projection fields", () => {
    for (const rice of riceProfiles) {
      expect(Object.keys(toMapProfile(rice)).sort()).toEqual(MAP_KEYS);
    }
  });

  it("preserves the values the map and rail render", () => {
    const rice = riceProfiles[0];
    const map = toMapProfile(rice);
    expect(map.id).toBe(rice.id);
    expect(map.name).toBe(rice.name);
    expect(map.prefecture).toBe(rice.prefecture);
    expect(map.sweetness).toBe(rice.sweetness);
    expect(map.hardness).toBe(rice.hardness);
    expect(map.short_).toBe(rice.short_);
    expect(map.best_match_dishes).toEqual(rice.best_match_dishes);
    expect(map.rakuten_search_keyword).toBe(rice.rakuten_search_keyword);
  });

  it("drops the long editorial fields", () => {
    const map = toMapProfile(riceProfiles[0]) as unknown as Record<
      string,
      unknown
    >;
    expect(map.description).toBeUndefined();
    expect(map.sommelier_note).toBeUndefined();
    expect(map.semantic_tags).toBeUndefined();
    expect(map.spring_pairings).toBeUndefined();
  });
});

describe("projection equivalence with the full catalogue", () => {
  const maps = toMapProfiles(riceProfiles);

  it("places every brand on the same display point", () => {
    const fromFull = new Map(
      toDisplayPoints(riceProfiles).map((point) => [
        point.id,
        [point.display_x, point.display_y],
      ])
    );
    for (const point of toDisplayPoints(maps)) {
      expect([point.display_x, point.display_y]).toEqual(
        fromFull.get(point.id)
      );
    }
  });

  it("ranks the same coordinate matches", () => {
    const target = { hardness: 3.4, sweetness: 2.6 };
    const fromFull = calculateTopCoordinateMatches(
      toDisplayPoints(riceProfiles),
      target,
      4
    ).map((match) => match.rice.id);
    const fromMap = calculateTopCoordinateMatches(
      toDisplayPoints(maps),
      target,
      4
    ).map((match) => match.rice.id);
    expect(fromMap).toEqual(fromFull);
  });

  it("ranks the same taste neighbours", () => {
    const reference = riceProfiles[0];
    const fromFull = calculateTasteNeighbours(
      riceProfiles,
      reference,
      3
    ).map((match) => match.rice.id);
    const fromMap = calculateTasteNeighbours(
      maps,
      toMapProfile(reference),
      3
    ).map((match) => match.rice.id);
    expect(fromMap).toEqual(fromFull);
  });
});

describe("expandMapProfile", () => {
  it("fills the fields the detail panel reads with inert defaults", () => {
    const expanded = expandMapProfile(toMapProfile(riceProfiles[0]));
    for (const field of [
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
    ] as const) {
      expect(Array.isArray(expanded[field])).toBe(true);
    }
    expect(typeof expanded.description).toBe("string");
    expect(typeof expanded.sommelier_note).toBe("string");
    expect(typeof expanded.pairing_reason).toBe("string");
    expect(expanded.quadrant.length).toBeGreaterThan(0);
  });

  it("keeps every projection field untouched", () => {
    const rice = riceProfiles[0];
    const map = toMapProfile(rice);
    const expanded = expandMapProfile(map);
    expect(expanded.id).toBe(rice.id);
    expect(expanded.short_).toBe(rice.short_);
    expect(expanded.best_match_dishes).toEqual(rice.best_match_dishes);
    expect(expanded.good_with).toEqual(rice.good_with);
    expect(expanded.cold_rice_quality).toBe(rice.cold_rice_quality);
    expect(expanded.texture_label).toBe(rice.texture_label);
  });
});
