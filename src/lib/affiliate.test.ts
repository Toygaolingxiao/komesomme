import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AFFILIATE_LINK_REL,
  AFFILIATE_PR_LABEL,
  AFFILIATE_PR_NOTICE,
  AFFILIATE_PR_NOTICE_DETAIL,
  AMAZON_ASSOCIATE_DISCLOSURE,
  amazonSearchUrl,
  furusatoQuery,
  mercariSearchUrl,
  isValueCommerceReferralHref,
  rakutenFurusatoSearchUrl,
  shopQuery,
  valueCommerceImpressionPixelUrl,
  wrapValueCommerceIfReady,
  furusatoHonpoSearchUrl,
  furusatoLaboSearchUrl,
  wrapFurusatoHonpoSearchUrl,
  wrapFurusatoLaboSearchUrl,
  wrapYahooSearchUrl,
  yahooFurusatoSearchUrl,
  yahooFurusatoSheetKeyword,
  yahooShoppingSearchUrl,
  yahooValueCommerceAffiliateId,
} from "./affiliate";

describe("disclosure copy layering", () => {
  it("keeps Amazon Art.5 and short PR separate from the ASP list", () => {
    expect(AMAZON_ASSOCIATE_DISCLOSURE).toContain("アソシエイトとして");
    expect(AFFILIATE_PR_LABEL).toBe("※PR");
    expect(AFFILIATE_LINK_REL).toBe("noopener noreferrer nofollow sponsored");
    expect(AFFILIATE_PR_NOTICE).toContain("アフィリエイト広告");
    expect(AFFILIATE_PR_NOTICE).not.toContain("バリューコマース");
    // VC was re-adopted on 2026-11-10, so the terms-level ASP list names it
    // again; the near-CTA chrome notice still stays generic.
    expect(AFFILIATE_PR_NOTICE_DETAIL).toContain("バリューコマース");
    expect(AFFILIATE_PR_NOTICE_DETAIL).toContain("Amazonアソシエイト");
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
    expect(
      yahooFurusatoSheetKeyword({
        prefecture: "北海道",
        brand: "ゆめぴりか",
        furusatoKeywords: ["北海道 ゆめぴりか ふるさと納税"],
      }),
    ).toBe("北海道 ゆめぴりか ふるさと納税");
    expect(yahooFurusatoSheetKeyword({ prefecture: "栃木県", brand: "あさひの夢" })).toBe(
      "栃木県 あさひの夢 ふるさと納税",
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

  it("builds mercari search with afid", () => {
    vi.stubEnv("NEXT_PUBLIC_MERCARI_AFID", "7137822833");
    const url = mercariSearchUrl("長野県 風さやか 白米");
    expect(url).toContain("https://jp.mercari.com/search?");
    expect(url).toContain("keyword=");
    expect(url).toContain("afid=7137822833");
  });
});

describe("ValueCommerce wrap (re-adopted 2026-11-10)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("wraps a target URL with sid/pid and vc_url", () => {
    const wrapped = wrapValueCommerceIfReady(
      "https://shopping.yahoo.co.jp/search?p=rice",
      "123",
      "456",
    );
    const url = new URL(wrapped);
    expect(url.origin + url.pathname).toBe(
      "https://ck.jp.ap.valuecommerce.com/servlet/referral",
    );
    expect(url.searchParams.get("sid")).toBe("123");
    expect(url.searchParams.get("pid")).toBe("456");
    expect(url.searchParams.get("vc_url")).toBe(
      "https://shopping.yahoo.co.jp/search?p=rice",
    );
    expect(isValueCommerceReferralHref(wrapped)).toBe(true);
  });

  it("returns the plain URL when the pair is missing", () => {
    const target = "https://shopping.yahoo.co.jp/search?p=rice";
    expect(wrapValueCommerceIfReady(target)).toBe(target);
    expect(wrapValueCommerceIfReady(target, "123")).toBe(target);
    expect(wrapValueCommerceIfReady(target, "", "456")).toBe(target);
  });

  it("never double-wraps a referral URL", () => {
    const once = wrapValueCommerceIfReady(
      "https://shopping.yahoo.co.jp/search?p=rice",
      "123",
      "456",
    );
    expect(wrapValueCommerceIfReady(once, "123", "456")).toBe(once);
  });

  it("kill switch VALUE_COMMERCE_WRAP=off returns plain URLs", () => {
    vi.stubEnv("VALUE_COMMERCE_WRAP", "off");
    const target = "https://shopping.yahoo.co.jp/search?p=rice";
    expect(wrapValueCommerceIfReady(target, "123", "456")).toBe(target);
    expect(wrapYahooSearchUrl("rice", "123", "456")).toBe(
      yahooShoppingSearchUrl("rice"),
    );
  });

  it("wrapYahooSearchUrl wraps the search URL when the pair is passed", () => {
    const wrapped = wrapYahooSearchUrl("rice", "123", "456");
    expect(isValueCommerceReferralHref(wrapped)).toBe(true);
    const url = new URL(wrapped);
    expect(url.searchParams.get("vc_url")).toBe(yahooShoppingSearchUrl("rice"));
  });

  it("builds the Yahoo API affiliate_id exactly as the VC guide specifies", () => {
    expect(yahooValueCommerceAffiliateId("123", "456")).toBe(
      "http://ck.jp.ap.valuecommerce.com/servlet/referral?sid=123&pid=456&vc_url=",
    );
  });

  it("builds the impression pixel URL for the same pair", () => {
    expect(valueCommerceImpressionPixelUrl("123", "456")).toBe(
      "https://ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=123&pid=456",
    );
  });

  it("builds furusato portal search URLs on the verified formats", () => {
    expect(furusatoHonpoSearchUrl("北海道 ゆめぴりか")).toBe(
      `https://furusatohonpo.jp/donate/s/?keyword=${encodeURIComponent("北海道 ゆめぴりか ふるさと納税")}`,
    );
    expect(furusatoLaboSearchUrl("北海道 ゆめぴりか")).toBe(
      `https://furusato.asahi.co.jp/goods/?word=${encodeURIComponent("北海道 ゆめぴりか ふるさと納税")}`,
    );
  });

  it("wraps furusato portal searches only when that portal's pair is passed", () => {
    expect(wrapFurusatoHonpoSearchUrl("rice")).toBe(furusatoHonpoSearchUrl("rice"));
    const honpo = wrapFurusatoHonpoSearchUrl("rice", "111", "222");
    expect(isValueCommerceReferralHref(honpo)).toBe(true);
    expect(new URL(honpo).searchParams.get("vc_url")).toBe(furusatoHonpoSearchUrl("rice"));
    expect(wrapFurusatoLaboSearchUrl("rice")).toBe(furusatoLaboSearchUrl("rice"));
    const labo = wrapFurusatoLaboSearchUrl("rice", "111", "333");
    expect(new URL(labo).searchParams.get("pid")).toBe("333");
    expect(new URL(labo).searchParams.get("vc_url")).toBe(furusatoLaboSearchUrl("rice"));
  });
});
