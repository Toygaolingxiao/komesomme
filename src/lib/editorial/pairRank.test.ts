import { describe, expect, it } from "vitest";
import { riceProfiles } from "@/data/rice/catalog";
import { PAIRING_PAGES } from "@/data/editorial/pairings";
import {
  listMatchesAliases,
  rankPairingCandidates,
  textMatchesAliases,
} from "@/lib/editorial/pairRank";

describe("textMatchesAliases", () => {
  it("matches substrings in Japanese dish names", () => {
    expect(textMatchesAliases("カレーライス", ["カレー"])).toBe(true);
    expect(textMatchesAliases("強い香辛料のカレー", ["カレー"])).toBe(true);
    expect(textMatchesAliases("お弁当", ["弁当"])).toBe(true);
    expect(textMatchesAliases("刺身", ["カレー"])).toBe(false);
  });
});

describe("rankPairingCandidates", () => {
  it("returns Top brands for curry from the catalogue", () => {
    const curry = PAIRING_PAGES.find((page) => page.slug === "curry")!;
    const ranked = rankPairingCandidates(riceProfiles, {
      aliases: curry.dishAliases,
      avoidAliases: curry.avoidAliases,
      bias: curry.bias,
    });
    expect(ranked.top.length).toBeGreaterThan(0);
    expect(ranked.top.length).toBeLessThanOrEqual(5);
    expect(
      ranked.top.every((rice) => listMatchesAliases(rice.best_match_dishes, curry.dishAliases))
    ).toBe(true);
    expect(ranked.avoidSource).toBe("catalog");
    expect(ranked.avoid.length).toBeGreaterThan(0);
  });

  it("falls back to axis opposites when avoid text is missing", () => {
    const bento = PAIRING_PAGES.find((page) => page.slug === "bento")!;
    const ranked = rankPairingCandidates(riceProfiles, {
      aliases: bento.dishAliases,
      avoidAliases: bento.avoidAliases,
      bias: bento.bias,
      allowAxisOppositeAvoid: true,
    });
    expect(ranked.top.length).toBeGreaterThan(0);
    expect(ranked.avoid.length).toBeGreaterThan(0);
    expect(ranked.avoidSource).toBe("axis");
    const topIds = new Set(ranked.top.map((rice) => rice.id));
    expect(ranked.avoid.every((rice) => !topIds.has(rice.id))).toBe(true);
  });

  it("orders closer bias scores first", () => {
    const curry = PAIRING_PAGES.find((page) => page.slug === "curry")!;
    const ranked = rankPairingCandidates(riceProfiles, {
      aliases: curry.dishAliases,
      bias: curry.bias,
      topN: 3,
    });
    const scores = ranked.top.map((rice) => {
      const ds = Math.abs(rice.sweetness - (curry.bias.sweetness ?? 0));
      const dh = Math.abs(rice.hardness - (curry.bias.hardness ?? 0));
      return ds + dh;
    });
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]!).toBeGreaterThanOrEqual(scores[i - 1]! - 0.01);
    }
  });
});
