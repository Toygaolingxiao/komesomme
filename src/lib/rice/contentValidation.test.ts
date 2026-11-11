import { describe, expect, it } from "vitest";
import { EDITORIAL_COLLECTIONS } from "@/data/editorial/collections";
import { riceProfiles } from "@/data/rice/catalog";
import {
  collectContentIssues,
  findDuplicateSentences,
  findForeignBrandMentions,
  findPrematureTokuA,
  type NamedText,
} from "../../../scripts/validate-content";

type ProfileText = Parameters<typeof findDuplicateSentences>[0][number];

function profile(
  id: string,
  name: string,
  short_: string,
  description = "固有の説明文です。",
): ProfileText {
  return { id, name, short_, description };
}

describe("findDuplicateSentences", () => {
  const shared = "冷めても食感が落ちにくい性質があります。";

  it("flags one full sentence reused across three brands", () => {
    const errors = findDuplicateSentences([
      profile("a", "銘柄甲", shared),
      profile("b", "銘柄乙", `別の前置き。${shared}`),
      profile("c", "銘柄丙", "序文です。", shared),
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("a, b, c");
  });

  it("allows the same sentence in only two brands", () => {
    const errors = findDuplicateSentences([
      profile("a", "銘柄甲", shared),
      profile("b", "銘柄乙", shared),
    ]);
    expect(errors).toEqual([]);
  });

  it("ignores short phrases even when widely reused", () => {
    const errors = findDuplicateSentences([
      profile("a", "銘柄甲", "粒立ちがよい。"),
      profile("b", "銘柄乙", "粒立ちがよい。"),
      profile("c", "銘柄丙", "粒立ちがよい。"),
    ]);
    expect(errors).toEqual([]);
  });

  it("does not count repetition inside one brand's own copy", () => {
    const errors = findDuplicateSentences([
      profile("a", "銘柄甲", shared, `説明にも書く。${shared}`),
      profile("b", "銘柄乙", "無関係な短い紹介。"),
    ]);
    expect(errors).toEqual([]);
  });

  it("normalises whitespace before comparing", () => {
    const errors = findDuplicateSentences([
      profile("a", "銘柄甲", shared),
      profile("b", "銘柄乙", "冷めても 食感が落ちにくい　性質があります。"),
      profile("c", "銘柄丙", shared),
    ]);
    expect(errors).toHaveLength(1);
  });
});

describe("findPrematureTokuA", () => {
  const texts = (text: string): NamedText[] => [{ source: "test", text }];

  it("flags a sentence claiming 特A for 令和8年産", () => {
    const errors = findPrematureTokuA(
      texts("令和8年産で特Aに選ばれた銘柄です。"),
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("test");
  });

  it("allows a 令和8年産 debut mention with no 特A claim", () => {
    expect(
      findPrematureTokuA(texts("令和8年産から本格的にデビューする銘柄です。")),
    ).toEqual([]);
  });

  it("allows 特A for 令和7年産, the latest published ranking", () => {
    expect(
      findPrematureTokuA(texts("令和7年産で特Aに返り咲きました。")),
    ).toEqual([]);
  });

  it("requires both terms in the same sentence", () => {
    expect(
      findPrematureTokuA(
        texts("令和7年産で特Aを取りました。令和8年産も出荷が始まります。"),
      ),
    ).toEqual([]);
  });

  it("has zero false positives on the live catalogue and collections", () => {
    const { errors } = collectContentIssues();
    expect(errors.filter((error) => error.includes("特A"))).toEqual([]);
    expect(EDITORIAL_COLLECTIONS.length).toBeGreaterThan(0);
    expect(riceProfiles.length).toBeGreaterThan(0);
  });
});

describe("findForeignBrandMentions", () => {
  const base = [
    profile("yumepirika", "ゆめぴりか", "北海道の甘い米。"),
    profile("koshihikari-bl", "コシヒカリ", "基準の米。"),
    profile("koshihikari-uonuma", "コシヒカリ（魚沼産）", "魚沼の米。"),
    profile("ryu-no-hitomi", "龍の瞳（いのちの壱）", "大粒の米。"),
    profile("inochi-no-ichi", "いのちの壱", "岐阜の米。"),
  ];

  it("warns when one brand's copy names another brand", () => {
    const warnings = findForeignBrandMentions([
      ...base,
      profile("other", "ほか銘柄", "ゆめぴりかに似た甘さの米。"),
    ]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("ゆめぴりか");
  });

  it("treats the full suffixed name as distinctive", () => {
    const warnings = findForeignBrandMentions([
      ...base,
      profile("other", "ほか銘柄", "コシヒカリ（魚沼産）に迫る味わい。"),
    ]);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("koshihikari-uonuma");
  });

  it("ignores bare generic cultivar names", () => {
    const warnings = findForeignBrandMentions([
      ...base,
      profile("other", "ほか銘柄", "コシヒカリの血統を受け継ぐ米。"),
    ]);
    expect(warnings).toEqual([]);
  });

  it("ignores a brand's own name and same-lineage self-references", () => {
    const warnings = findForeignBrandMentions([
      ...base.map((entry) =>
        entry.id === "ryu-no-hitomi"
          ? profile(
              entry.id,
              entry.name,
              "いのちの壱の系統を受け継ぐ大粒の米。",
            )
          : entry,
      ),
    ]);
    expect(warnings).toEqual([]);
  });
});
