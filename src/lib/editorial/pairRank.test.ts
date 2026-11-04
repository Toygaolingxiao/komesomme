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
      ranked.top.every((rice) =>
        listMatchesAliases(rice.best_match_dishes, curry.dishAliases),
      ),
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

  it("ranks sushi by the vinegar-rice dimensions (clarity, absorption, cold)", () => {
    const sushi = PAIRING_PAGES.find((page) => page.slug === "sushi")!;
    const ranked = rankPairingCandidates(riceProfiles, {
      aliases: sushi.dishAliases,
      avoidAliases: sushi.avoidAliases,
      bias: sushi.bias,
      pinTopIds: sushi.pinTopIds,
    });
    expect(ranked.top[0].id).toBe("sasanishiki");
    // 雪若丸 enters the top on the added dimensions (research-backed
    // sushi profile); it was outside the top 5 under the 3-axis bias.
    expect(ranked.top.map((rice) => rice.id)).toContain("yukiwakamaru");
  });

  it("gives each fallback page its own anti-profile avoid list", () => {
    const avoidOf = (slug: string) => {
      const page = PAIRING_PAGES.find((row) => row.slug === slug)!;
      const ranked = rankPairingCandidates(riceProfiles, {
        aliases: page.dishAliases,
        avoidAliases: page.avoidAliases,
        bias: page.bias,
        allowAxisOppositeAvoid: true,
        avoidBias: page.avoidBias,
        allowBiasFillTop: page.allowBiasFillTop,
        coldFirst: page.coldFirst,
      });
      expect(ranked.avoidSource).toBe("axis");
      return ranked.avoid.map((rice) => rice.id);
    };
    const nabe = avoidOf("nabe");
    const chahan = avoidOf("chahan");
    const karaage = avoidOf("karaage");
    // All three dishes genuinely dislike the sticky class, so the milky
    // core may repeat — but the lists must not be identical any more.
    expect(nabe).not.toEqual(chahan);
    expect(karaage).not.toEqual(chahan);
    expect(nabe).toContain("milky-queen");
  });

  it("fills Top from bias when catalogue matches are sparse", () => {
    const karaage = PAIRING_PAGES.find((page) => page.slug === "karaage")!;
    const ranked = rankPairingCandidates(riceProfiles, {
      aliases: karaage.dishAliases,
      avoidAliases: karaage.avoidAliases,
      bias: karaage.bias,
      allowAxisOppositeAvoid: true,
      allowBiasFillTop: true,
    });
    expect(ranked.top).toHaveLength(5);
    expect(ranked.avoid.length).toBeGreaterThan(0);
  });
});
