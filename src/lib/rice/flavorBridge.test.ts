import { describe, expect, it } from "vitest";
import { riceProfiles } from "@/data/rice/catalog";
import { buildSemanticReason } from "./flavorBridge";

function byName(name: string) {
  const rice = riceProfiles.find((profile) => profile.name === name);
  if (!rice) throw new Error(`catalogue is missing ${name}`);
  return rice;
}

describe("buildSemanticReason brand differentiation", () => {
  // Regression for the live consultation where ranks #2 and #4 received the
  // same Flavor Bridge sentence word for word: both brands land in the same
  // highball bridge branch, so only the brand-specific tail separates them.
  it("gives two brands in the same bridge branch different reasons", () => {
    const query = "ハイボールと唐揚げに合う米";
    const ichihomare = buildSemanticReason(query, byName("いちほまれ"));
    const akihonomi = buildSemanticReason(query, byName("あきほなみ"));

    expect(ichihomare).not.toBe(akihonomi);
    expect(ichihomare).toContain("とんかつ");
    expect(akihonomi).toContain("黒豚の角煮");
  });

  it("keeps reasons distinct across the catalogue for template queries", () => {
    const queries = [
      "ハイボールと唐揚げに合う米",
      "冷めても美味しいお弁当用",
      "疲れた日にやさしいご飯",
      "日本酒に合う米",
      "カレーに合う米",
    ];

    for (const query of queries) {
      const reasons = riceProfiles.map((rice) => buildSemanticReason(query, rice));
      const distinct = new Set(reasons).size;
      // Before the brand tail these queries produced 2–3 distinct reasons
      // across all 106 brands. Residual duplicates are catalogue rows whose
      // dish lists are themselves near-identical, so allow a small margin.
      expect(distinct, query).toBeGreaterThanOrEqual(85);
    }
  });
});
