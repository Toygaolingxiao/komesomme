import { describe, expect, it } from "vitest";
import { riceProfiles } from "@/data/rice/catalog";
import { BRAND_I18N } from "@/data/rice/brandI18n";
import { isTokuA, TOKU_A_IDS } from "@/data/rice/tokuA";

describe("BRAND_I18N", () => {
  it("covers every running catalogue id", () => {
    const missing = riceProfiles.filter((rice) => !BRAND_I18N[rice.id]).map((rice) => rice.id);
    expect(missing, missing.join(", ")).toEqual([]);
  });

  it("does not keep leftover ids", () => {
    const ids = new Set(riceProfiles.map((rice) => rice.id));
    const extra = Object.keys(BRAND_I18N).filter((id) => !ids.has(id));
    expect(extra, extra.join(", ")).toEqual([]);
  });
});

describe("特A", () => {
  it("only marks ids that exist in the catalogue", () => {
    const ids = new Set(riceProfiles.map((rice) => rice.id));
    const unknown = [...TOKU_A_IDS].filter((id) => !ids.has(id));
    expect(unknown).toEqual([]);
  });

  it("marks 青天の霹靂 and 魚沼コシヒカリ", () => {
    expect(isTokuA("seiten-no-hekireki")).toBe(true);
    expect(isTokuA("koshihikari-uonuma")).toBe(true);
  });
});
