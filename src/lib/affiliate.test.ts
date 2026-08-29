import { afterEach, describe, expect, it, vi } from "vitest";
import {
  amazonSearchUrl,
  furusatoQuery,
  shopQuery,
  yahooShoppingSearchUrl,
} from "./affiliate";

describe("TS-UNIT-04 shop / amazon URL builders", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("builds shop and furusato queries", () => {
    expect(shopQuery({ prefecture: "福島県", brand: "里山のつぶ" })).toBe(
      "福島県 里山のつぶ 白米",
    );
    expect(furusatoQuery({ prefecture: "福島県", brand: "里山のつぶ" })).toBe(
      "福島県 里山のつぶ",
    );
  });

  it("builds amazon search with optional tag", () => {
    vi.stubEnv("NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG", "");
    const plain = amazonSearchUrl("福島県 里山のつぶ 白米");
    expect(plain).toContain("https://www.amazon.co.jp/s?");
    expect(plain).toContain("k=");

    vi.stubEnv("NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG", "komesomme-22");
    const tagged = amazonSearchUrl("test");
    expect(tagged).toContain("tag=komesomme-22");
  });

  it("builds yahoo shopping search", () => {
    const url = yahooShoppingSearchUrl("ゆめぴりか");
    expect(url).toContain("https://shopping.yahoo.co.jp/search?");
    expect(url).toContain(encodeURIComponent("ゆめぴりか"));
  });
});
