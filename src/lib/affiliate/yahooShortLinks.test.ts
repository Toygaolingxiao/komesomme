import { describe, expect, it } from "vitest";
import { mergeYahooAffiliateSheet, parseYahooShoppingShortLink, isYahooPromoShortHref, resolveYahooShopHref } from "./yahooShortLinks";

describe("Yahoo Shopping official short links", () => {
  it("accepts yahoo.jp /xxxx and strips a trailing slash", () => {
    expect(parseYahooShoppingShortLink("https://yahoo.jp/V5YuUE")).toBe(
      "https://yahoo.jp/V5YuUE",
    );
    expect(parseYahooShoppingShortLink("yahoo.jp/SYHUi4/")).toBe(
      "https://yahoo.jp/SYHUi4",
    );
    expect(parseYahooShoppingShortLink("https://yahoo.jp/t5-DJZ")).toBe(
      "https://yahoo.jp/t5-DJZ",
    );
    expect(parseYahooShoppingShortLink("https://yahoo.jp/Z4_Crm")).toBe(
      "https://yahoo.jp/Z4_Crm",
    );
  });

  it("lets a filled promo short link win over search", () => {
    expect(
      resolveYahooShopHref("https://yahoo.jp/Z4_Crm", "https://shopping.yahoo.co.jp/search?p=米"),
    ).toBe("https://yahoo.jp/Z4_Crm");
    expect(isYahooPromoShortHref("https://yahoo.jp/t5-DJZ")).toBe(true);
    expect(isYahooPromoShortHref("https://shopping.yahoo.co.jp/search?p=米")).toBe(false);
  });

  it("rejects search URLs, SKU pages, and query strings", () => {
    expect(
      parseYahooShoppingShortLink("https://shopping.yahoo.co.jp/search?p=米"),
    ).toBeUndefined();
    expect(
      parseYahooShoppingShortLink(
        "https://store.shopping.yahoo.co.jp/rs-takeo/10000019.html",
      ),
    ).toBeUndefined();
    expect(
      parseYahooShoppingShortLink("https://yahoo.jp/V5YuUE?foo=1"),
    ).toBeUndefined();
    expect(parseYahooShoppingShortLink("")).toBeUndefined();
  });

  it("merges catalogue with promo_url and keeps empty rows on search fallback", () => {
    const rows = mergeYahooAffiliateSheet(
      [
        { id: "yumepirika", name: "ゆめぴりか", prefecture: "北海道", region: "北海道・東北" },
        { id: "hitomebore", name: "ひとめぼれ", prefecture: "宮城県", region: "北海道・東北" },
      ],
      [
        {
          brand_id: "yumepirika",
          promo_url: "https://yahoo.jp/V5YuUE",
          recorded_at: "2026-09-01T13:00:00.000Z",
        },
      ],
    );
    expect(rows[0]).toMatchObject({
      brandId: "yumepirika",
      promoUrl: "https://yahoo.jp/V5YuUE",
      noProducts: false,
      recordedAt: "2026-09-01T13:00:00.000Z",
    });
    expect(rows[1]).toMatchObject({
      brandId: "hitomebore",
      promoUrl: null,
      noProducts: false,
      recordedAt: null,
    });
  });
});
