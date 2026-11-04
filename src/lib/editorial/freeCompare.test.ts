import { describe, expect, it } from "vitest";
import {
  curatedKey,
  freeCompareDataset,
  summarizeComparison,
  type FreeBrand,
} from "@/lib/editorial/freeCompare";
import { RICE_REGIONS } from "@/lib/rice/regions";

const dataset = freeCompareDataset();
const byId = new Map(dataset.brands.map((brand) => [brand.id, brand]));
const brand = (id: string): FreeBrand => byId.get(id)!;

describe("freeCompareDataset", () => {
  it("covers every brand in the region-grouped picker", () => {
    expect(dataset.brands.length).toBeGreaterThan(100);
    const grouped = RICE_REGIONS.reduce(
      (sum, region) =>
        sum + dataset.brands.filter((row) => row.region === region.name).length,
      0,
    );
    expect(grouped).toBe(dataset.brands.length);
    expect(dataset.points).toHaveLength(dataset.brands.length);
  });

  it("maps all 12 curated pairs, order-insensitively", () => {
    expect(Object.keys(dataset.curated)).toHaveLength(12);
    expect(dataset.curated[curatedKey("milky-queen", "yumepirika")]).toBe(
      "yumepirika-vs-milky-queen",
    );
  });
});

describe("summarizeComparison", () => {
  it("reports the real differences for yumepirika vs milky-queen", () => {
    const summary = summarizeComparison(
      brand("yumepirika"),
      brand("milky-queen"),
    );
    expect(summary.equalCount).toBe(8);
    expect(summary.aLeads).toEqual(
      expect.arrayContaining(["香り", "旨み", "油との相性"]),
    );
    expect(summary.bLeads).toEqual(["冷めてからの持ち"]);
    expect(summary.coordinateNote).toContain("地図の位置は一致します");
  });

  it("finds the single differing indicator for the milky sisters", () => {
    const summary = summarizeComparison(
      brand("milky-queen"),
      brand("milky-princess"),
    );
    expect(summary.diffs).toHaveLength(1);
    expect(summary.diffs[0].label).toBe("粒の大きさ");
    expect(summary.bLeads).toEqual(["粒の大きさ"]);
  });
});

describe("free-compare map coordinates", () => {
  it("keeps data neighbours as map neighbours (no crowd-spreading)", () => {
    const points = new Map(dataset.points.map((p) => [p.id, p]));
    const tsubu = points.get("tsubuzoroi")!;
    const obako = points.get("yumeobako")!;
    // sweetness 3 vs 4, hardness both 3: adjacent on the map, never flung apart
    expect(Math.abs(tsubu.x - obako.x)).toBeLessThan(1.4);
    expect(Math.abs(tsubu.y - obako.y)).toBeLessThan(0.4);
    const yume = points.get("yumepirika")!;
    const milky = points.get("milky-queen")!;
    expect(Math.abs(yume.x - milky.x)).toBeLessThan(0.4);
    expect(Math.abs(yume.y - milky.y)).toBeLessThan(0.4);
  });
});
