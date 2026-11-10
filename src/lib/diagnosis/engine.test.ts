import { describe, expect, it } from "vitest";
import { findRiceProfile, riceProfiles } from "@/data/rice/catalog";
import { listMatchesAliases } from "@/lib/editorial/pairRank";
import {
  buildTarget,
  deltaReason,
  noveltyOf,
  rankPool,
  runDiagnosis,
} from "@/lib/diagnosis/engine";
import {
  DISH_KEYS,
  TEXTURE_KEYS,
  dishOption,
  type DiagnosisAnswers,
  type TextureKey,
} from "@/lib/diagnosis/questions";

function answers(partial: Partial<DiagnosisAnswers>): DiagnosisAnswers {
  return {
    dish: "curry",
    baseId: "koshihikari-bl",
    baseIsDefault: false,
    tex: "tsubu",
    cooker: "ih",
    ...partial,
  };
}

function profile(id: string) {
  const rice = findRiceProfile(id);
  if (!rice) throw new Error(`missing profile ${id}`);
  return rice;
}

describe("runDiagnosis determinism (§7.1)", () => {
  it("same answers produce the same three picks, 50 runs in a row", () => {
    const input = answers({ dish: "nabe", baseId: "yumepirika", tex: "mochi" });
    const first = runDiagnosis(input, riceProfiles);
    const expected = first.picks.map((pick) => pick.rice.id);
    for (let i = 0; i < 50; i += 1) {
      const again = runDiagnosis(input, riceProfiles);
      expect(again.picks.map((pick) => pick.rice.id)).toEqual(expected);
    }
  });
});

describe("pool rules (§7.2–7.4)", () => {
  it("R0: the base rice never appears among the picks", () => {
    for (const baseId of ["yumepirika", "koshihikari-bl", "milky-queen"]) {
      for (const dish of DISH_KEYS) {
        const out = runDiagnosis(answers({ dish, baseId }), riceProfiles);
        expect(out.picks.map((pick) => pick.rice.id)).not.toContain(baseId);
        expect(new Set(out.picks.map((pick) => pick.rice.id)).size).toBe(3);
      }
    }
  });

  it("R1: for curry, no pick lists curry in avoid_pairings", () => {
    const avoidAliases = dishOption("curry").avoidAliases;
    for (const tex of TEXTURE_KEYS) {
      const out = runDiagnosis(answers({ dish: "curry", tex }), riceProfiles);
      for (const pick of out.picks) {
        expect(
          listMatchesAliases(pick.rice.avoid_pairings, avoidAliases),
        ).toBe(false);
      }
    }
  });

  it("R2: sashimi never picks the excluded 魚沼コシヒカリ", () => {
    for (const tex of TEXTURE_KEYS) {
      const out = runDiagnosis(answers({ dish: "sashimi", tex }), riceProfiles);
      expect(out.picks.map((pick) => pick.rice.id)).not.toContain(
        "koshihikari-uonuma",
      );
    }
  });

  it("L2: a main pool under three falls back to the cleaned pool", () => {
    const curryPool = new Set(
      riceProfiles
        .filter((rice) =>
          listMatchesAliases(
            rice.best_match_dishes,
            dishOption("curry").poolAliases,
          ),
        )
        .map((rice) => rice.id),
    );
    const keep = [...curryPool].slice(0, 2);
    const trimmed = riceProfiles.filter(
      (rice) =>
        rice.id === "yumepirika" || !curryPool.has(rice.id) || keep.includes(rice.id),
    );
    const out = runDiagnosis(
      answers({ dish: "curry", baseId: "yumepirika" }),
      trimmed,
    );
    expect(out.poolFallback).toBe(true);
    expect(new Set(out.picks.map((pick) => pick.rice.id)).size).toBe(3);
    expect(out.picks.map((pick) => pick.rice.id)).not.toContain("yumepirika");
  });
});

describe("slot properties over the real catalogue (§7.5–7.6)", () => {
  const bases: Array<Partial<DiagnosisAnswers>> = [
    { baseId: "koshihikari-bl", baseIsDefault: true },
    { baseId: "koshihikari-bl", baseIsDefault: false },
    { baseId: "yumepirika", baseIsDefault: false },
  ];

  it("taikou always differs in direction from honmei", () => {
    for (const dish of DISH_KEYS) {
      for (const tex of TEXTURE_KEYS) {
        for (const base of bases) {
          const out = runDiagnosis(answers({ dish, tex, ...base }), riceProfiles);
          const [honmei, taikou] = out.picks;
          const differs =
            taikou.rice.quadrant !== honmei.rice.quadrant ||
            Math.hypot(
              taikou.rice.sweetness - honmei.rice.sweetness,
              taikou.rice.hardness - honmei.rice.hardness,
            ) >= 1.2;
          expect(
            differs,
            `${dish}/${tex}/${base.baseId}: ${honmei.rice.id} vs ${taikou.rice.id}`,
          ).toBe(true);
        }
      }
    }
  });

  it("ana, when not a fallback, is outside the top five and near enough", () => {
    for (const dish of DISH_KEYS) {
      for (const tex of TEXTURE_KEYS) {
        for (const base of bases) {
          const input = answers({ dish, tex, ...base });
          const out = runDiagnosis(input, riceProfiles);
          if (out.anaFallback) continue;
          const { scored } = rankPool(input, riceProfiles, out.target, out.base);
          const anaIndex = scored.findIndex(
            (row) => row.rice.id === out.picks[2].rice.id,
          );
          expect(anaIndex).toBeGreaterThanOrEqual(5);
          expect(out.picks[2].score).toBeLessThanOrEqual(
            out.picks[0].score + 0.9 + 1e-9,
          );
          expect(noveltyOf(out.picks[2].rice, out.base)).toBeGreaterThanOrEqual(
            1.0,
          );
          // §2.4 maximises novelty among the eligible candidates. (The
          // stronger "ana ≥ honmei" reading does not hold on the real
          // catalogue: for nabe × yumepirika the honmei itself is the most
          // novel brand in reach, so no eligible ana can pass it.)
          const taken = new Set([
            out.picks[0].rice.id,
            out.picks[1].rice.id,
          ]);
          const eligible = scored.filter(
            (row, index) =>
              !taken.has(row.rice.id) &&
              index >= 5 &&
              row.score <= out.picks[0].score + 0.9 &&
              noveltyOf(row.rice, out.base) >= 1.0,
          );
          const maxNovelty = Math.max(
            ...eligible.map((row) => noveltyOf(row.rice, out.base)),
          );
          expect(noveltyOf(out.picks[2].rice, out.base)).toBeCloseTo(
            maxNovelty,
            9,
          );
        }
      }
    }
  });
});

describe("conflicts (§7.7)", () => {
  it("C1: sushi × mochi warns and caps stickiness at 2.6", () => {
    const out = runDiagnosis(
      answers({ dish: "sushi", tex: "mochi" }),
      riceProfiles,
    );
    expect(out.warning?.id).toBe("C1");
    expect(out.target.stickiness).toBeLessThanOrEqual(2.6);
    // With C1 the mochi merge weight halves: (1.8 + 0.4·4.2) / 1.4 ≈ 2.486.
    expect(out.target.stickiness).toBeCloseTo(2.486, 2);
  });

  it("C1 does not fire for sushi × tsubu", () => {
    const out = runDiagnosis(
      answers({ dish: "sushi", tex: "tsubu", baseId: "sasanishiki" }),
      riceProfiles,
    );
    expect(out.conflicts.map((row) => row.id)).not.toContain("C1");
  });

  it("C2: curry × mochi warns and caps stickiness/sweetness", () => {
    const out = runDiagnosis(
      answers({ dish: "curry", tex: "mochi" }),
      riceProfiles,
    );
    expect(out.warning?.id).toBe("C2");
    expect(out.target.stickiness).toBeLessThanOrEqual(3.0);
    expect(out.target.sweetness).toBeLessThanOrEqual(3.4);
  });

  it("C3: sashimi × mochi caps sweetness at 3.0", () => {
    const out = runDiagnosis(
      answers({ dish: "sashimi", tex: "mochi" }),
      riceProfiles,
    );
    expect(out.warning?.id).toBe("C3");
    expect(out.target.sweetness).toBeCloseTo(3.0, 9);
  });

  it("C4: nabe × tsubu caps hardness at 3.6", () => {
    const out = runDiagnosis(
      answers({ dish: "nabe", tex: "tsubu" }),
      riceProfiles,
    );
    expect(out.warning?.id).toBe("C4");
    expect(out.target.hardness).toBeCloseTo(3.6, 9);
  });

  it("C5: bento × tsubu keeps cold_rice_quality at or above 4.2", () => {
    const out = runDiagnosis(
      answers({ dish: "bento", tex: "tsubu" }),
      riceProfiles,
    );
    expect(out.warning?.id).toBe("C5");
    expect(out.target.cold_rice_quality).toBeGreaterThanOrEqual(4.2);
  });

  it("C6: pressure cooker × mochi tightens stickiness a further 0.3", () => {
    const out = runDiagnosis(
      answers({ dish: "curry", tex: "mochi", cooker: "pressure" }),
      riceProfiles,
    );
    expect(out.conflicts.map((row) => row.id)).toEqual(["C2", "C6"]);
    // Merge gives ≈2.978; pressure −0.5, then C6 −0.3.
    expect(out.target.stickiness).toBeCloseTo(2.178, 2);
  });

  it("C7: sushi with a sticky-sweet base warns without touching the target", () => {
    const out = runDiagnosis(
      answers({ dish: "sushi", tex: "tsubu", baseId: "yumepirika" }),
      riceProfiles,
    );
    expect(out.conflicts.map((row) => row.id)).toEqual(["C7"]);
    expect(out.conflicts[0].applied).toBe(false);
    expect(out.warning?.id).toBe("C7");
  });

  it("C7 stays silent when the base is not sticky-sweet", () => {
    const out = runDiagnosis(
      answers({ dish: "sushi", tex: "tsubu", baseId: "sasanishiki" }),
      riceProfiles,
    );
    expect(out.conflicts).toEqual([]);
    expect(out.warning).toBeNull();
  });

  it("F1: tkg × tsubu switches to the grain-forward bias", () => {
    const tsubu = buildTarget(
      answers({ dish: "tkg", tex: "tsubu" }),
      profile("koshihikari-bl"),
    );
    // The 粒立ち版 carries a clarity target; the 濃厚版 does not.
    // Merged: (4.5 + 0.8·4.4) / 1.8 ≈ 4.456.
    expect(tsubu.target.clarity).toBeCloseTo(4.4556, 3);
    const mochi = buildTarget(
      answers({ dish: "tkg", tex: "mochi" }),
      profile("koshihikari-bl"),
    );
    expect(mochi.target.clarity).toBeUndefined();
  });
});

describe("delta phrasing (§7.8)", () => {
  it("Δ=+2, single key (clarity)", () => {
    expect(deltaReason(profile("kinuhikari"), profile("kitakurin"), false)).toBe(
      "いつものきたくりんと比べると、後味がかなりすっきりする。",
    );
  });

  it("Δ=−2, single key (umami)", () => {
    expect(deltaReason(profile("akiroman"), profile("kyoshikibu"), false)).toBe(
      "いつもの京式部と比べると、旨みがだいぶ薄くなる。",
    );
  });

  it("Δ=+1, single key (umami)", () => {
    expect(deltaReason(profile("akisakari"), profile("kitakurin"), false)).toBe(
      "いつものきたくりんと比べると、旨みが少し増す。",
    );
  });

  it("Δ=−1, single key (sweetness)", () => {
    expect(deltaReason(profile("akiroman"), profile("emihokoro"), false)).toBe(
      "いつものえみほころと比べると、甘みは少し引く。",
    );
  });

  it("two deltas join in the continuative form", () => {
    expect(
      deltaReason(profile("yukinko-mai"), profile("yumepirika"), false),
    ).toBe(
      "いつものゆめぴりかと比べると、粘りがすっと引き、粒立ちがはっきり強くなる。",
    );
  });

  it("no headline delta falls back to the same-position sentence", () => {
    expect(
      deltaReason(profile("aichi-no-kaori"), profile("akebono"), false),
    ).toBe(
      "いつものアケボノと味の位置はほぼ同じです。産地と香りの違いを楽しむ一席としてどうぞ。",
    );
  });

  it("a default base is never called いつもの", () => {
    const text = deltaReason(
      profile("yukinko-mai"),
      profile("koshihikari-bl"),
      true,
    );
    expect(text).toBe(
      "ものさしのコシヒカリと比べると、粘りがすっと引き、粒立ちがはっきり強くなる。",
    );
    expect(text).not.toContain("いつもの");
  });
});

describe("spec §2.7 worked example (property form, §7.9)", () => {
  it("curry + yumepirika + tsubu + ih", () => {
    const input = answers({
      dish: "curry",
      baseId: "yumepirika",
      tex: "tsubu" as TextureKey,
      cooker: "ih",
    });
    const { target } = buildTarget(input, profile("yumepirika"));
    expect(target.sweetness).toBeCloseTo(2.46, 2);
    expect(target.hardness).toBeCloseTo(3.81, 2);
    expect(target.stickiness).toBeCloseTo(1.91, 2);
    expect(target.sauce_absorption).toBeCloseTo(4, 9);
    expect(target.clarity).toBeCloseTo(4.4, 9);

    const out = runDiagnosis(input, riceProfiles);
    const ids = out.picks.map((pick) => pick.rice.id);
    expect(ids).not.toContain("yumepirika");
    expect(new Set(ids).size).toBe(3);
    // Honmei sits in the curry pool on the grain-forward, low-stickiness side.
    expect(
      listMatchesAliases(
        out.picks[0].rice.best_match_dishes,
        dishOption("curry").poolAliases,
      ),
    ).toBe(true);
    expect(out.picks[0].rice.hardness).toBeGreaterThanOrEqual(3);
    expect(out.picks[0].rice.stickiness).toBeLessThanOrEqual(3);
    // The wildcard is at least as novel as the honmei, measured from yumepirika.
    expect(noveltyOf(out.picks[2].rice, out.base)).toBeGreaterThanOrEqual(
      noveltyOf(out.picks[0].rice, out.base) - 1e-9,
    );
    // Reasons are anchored to yumepirika by name.
    expect(out.picks[0].reason).toContain("ゆめぴりか");
  });
});
