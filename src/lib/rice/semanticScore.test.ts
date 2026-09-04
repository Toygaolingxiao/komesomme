import { describe, expect, it } from "vitest";
import { canonicalBrandName, nameMatch } from "./semanticScore";

describe("canonicalBrandName", () => {
  it("maps the common Chinese spelling of 青天の霹靂", () => {
    expect(canonicalBrandName("晴天的霹雳")).toBe("青天の霹靂");
    expect(canonicalBrandName("青天的霹雳")).toBe("青天の霹靂");
  });

  it("maps the catalog name itself", () => {
    expect(canonicalBrandName("青天の霹靂")).toBe("青天の霹靂");
  });

  it("maps English and Chinese catalog names", () => {
    expect(canonicalBrandName("Yumepirika")).toBe("ゆめぴりか");
    expect(canonicalBrandName("鱼沼越光")).toBe("コシヒカリ（魚沼産）");
  });

  it("does not treat an unrelated dish query as a brand", () => {
    expect(canonicalBrandName("ハイボールと唐揚げに合う米")).toBeNull();
  });
});

describe("nameMatch", () => {
  it("treats 晴天的霹雳 as an exact hit on 青天の霹靂", () => {
    expect(nameMatch("晴天的霹雳", "青天の霹靂")).toBe("exact");
  });
});
