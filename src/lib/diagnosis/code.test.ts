import { describe, expect, it } from "vitest";
import { riceProfiles } from "@/data/rice/catalog";
import { decodeDiagnosisCode, encodeDiagnosisCode } from "@/lib/diagnosis/code";
import {
  COOKER_KEYS,
  DISH_KEYS,
  TEXTURE_KEYS,
  type DiagnosisAnswers,
} from "@/lib/diagnosis/questions";

const validIds = new Set(riceProfiles.map((rice) => rice.id));

describe("diagnosis code roundtrip", () => {
  it("every dish × base form × texture × cooker combination round-trips", () => {
    const bases: Array<Pick<DiagnosisAnswers, "baseId" | "baseIsDefault">> = [
      { baseId: "koshihikari-bl", baseIsDefault: true },
      { baseId: "yumepirika", baseIsDefault: false },
      { baseId: "koshihikari-bl", baseIsDefault: false },
      { baseId: "seiten-no-hekireki", baseIsDefault: false },
    ];
    for (const dish of DISH_KEYS) {
      for (const base of bases) {
        for (const tex of TEXTURE_KEYS) {
          for (const cooker of COOKER_KEYS) {
            const input: DiagnosisAnswers = { dish, tex, cooker, ...base };
            const decoded = decodeDiagnosisCode(
              encodeDiagnosisCode(input),
              validIds,
            );
            expect(decoded).toEqual(input);
          }
        }
      }
    }
  });

  it("avg and an explicit koshihikari-bl base stay distinct", () => {
    const avg = decodeDiagnosisCode("v1.curry.avg.mochi.ih", validIds);
    expect(avg).toEqual({
      dish: "curry",
      baseId: "koshihikari-bl",
      baseIsDefault: true,
      tex: "mochi",
      cooker: "ih",
    });
    const named = decodeDiagnosisCode(
      "v1.curry.koshihikari-bl.mochi.ih",
      validIds,
    );
    expect(named?.baseId).toBe("koshihikari-bl");
    expect(named?.baseIsDefault).toBe(false);
  });
});

describe("diagnosis code rejection", () => {
  const invalid = [
    "",
    "v2.curry.avg.mochi.ih",
    "v1.curry.avg.mochi",
    "v1.curry.avg.mochi.ih.extra",
    "v1.pizza.avg.mochi.ih",
    "v1.curry.no-such-brand.mochi.ih",
    "v1.curry.Yumepirika.mochi.ih",
    "v1.curry.yume pirika.mochi.ih",
    "v1.curry.avg.spicy.ih",
    "v1.curry.avg.mochi.stove",
    "v1..avg.mochi.ih",
  ];
  for (const code of invalid) {
    it(`rejects ${JSON.stringify(code)}`, () => {
      expect(decodeDiagnosisCode(code, validIds)).toBeNull();
    });
  }
});
