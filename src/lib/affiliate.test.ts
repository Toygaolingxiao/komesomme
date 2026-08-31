import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AFFILIATE_PR_LABEL,
  AFFILIATE_PR_NOTICE,
  AFFILIATE_PR_NOTICE_DETAIL,
  AMAZON_ASSOCIATE_DISCLOSURE,
  amazonSearchUrl,
  furusatoQuery,
  rakutenFurusatoSearchUrl,
  shopQuery,
  yahooFurusatoSearchUrl,
  yahooShoppingSearchUrl,
} from "./affiliate";

describe("disclosure copy layering", () => {
  it("keeps Amazon Art.5 and short PR separate from the ASP list", () => {
    expect(AMAZON_ASSOCIATE_DISCLOSURE).toContain("アソシエイトとして");
    expect(AFFILIATE_PR_LABEL).toBe("※PR");
    expect(AFFILIATE_PR_NOTICE).toContain("アフィリエイト広告");
    expect(AFFILIATE_PR_NOTICE).not.toContain("バリューコマース");
    expect(AFFILIATE_PR_NOTICE_DETAIL).toContain("バリューコマース");
  });
});

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

  it("builds rakuten and yahoo furusato search URLs", () => {
    const rakuten = rakutenFurusatoSearchUrl("北海道 ゆめぴりか");
    expect(rakuten).toContain("search.rakuten.co.jp/search/mall/");
    expect(rakuten).toContain(encodeURIComponent("ふるさと納税"));
    const yahoo = yahooFurusatoSearchUrl("北海道 ゆめぴりか");
    expect(yahoo).toContain("shopping.yahoo.co.jp/search");
    expect(yahoo).toContain(encodeURIComponent("ふるさと納税"));
  });

  it("builds yahoo shopping search", () => {
    const url = yahooShoppingSearchUrl("ゆめぴりか");
    expect(url).toContain("https://shopping.yahoo.co.jp/search?");
    expect(url).toContain(encodeURIComponent("ゆめぴりか"));
  });
});
