import { describe, expect, it } from "vitest";
import {
  brandArtSrc,
  collectionArtSrc,
  distinctReading,
  mastheadArtSrc,
  pairingArtSrc,
  resolveBrandArt,
} from "@/lib/editorial/art";

describe("brandArtSrc", () => {
  it("returns a brand file when listed in the manifest", () => {
    expect(brandArtSrc("koshihikari-uonuma", "関東・甲信越")).toBe(
      "/brand-art/brands/koshihikari-uonuma.webp"
    );
  });

  it("falls back to region art when brand and prefecture art are missing", () => {
    expect(brandArtSrc("musubi-no-kami", "東海・北陸", "架空県")).toBe(
      "/brand-art/regions/tokai-hokuriku.webp"
    );
  });

  it("prefers prefecture art over region art when listed", () => {
    expect(brandArtSrc("kumasan-no-kagayaki", "九州・沖縄", "熊本県")).toBe(
      "/brand-art/prefectures/kumamoto.webp"
    );
  });

  it("prefers the brand file over region art", () => {
    expect(brandArtSrc("yumepirika", "北海道・東北")).toBe(
      "/brand-art/brands/yumepirika.webp"
    );
  });

  it("resolves newly added collection brand art", () => {
    expect(brandArtSrc("sasanishiki", "北海道・東北")).toBe(
      "/brand-art/brands/sasanishiki.webp"
    );
    expect(brandArtSrc("milky-queen", "全国銘柄")).toBe(
      "/brand-art/brands/milky-queen.webp"
    );
  });
});

describe("collectionArtSrc", () => {
  it("returns the collection path when listed", () => {
    expect(collectionArtSrc("shinmai.webp")).toBe("/brand-art/collections/shinmai.webp");
    expect(collectionArtSrc("toku-a.webp")).toBe("/brand-art/collections/toku-a.webp");
    expect(collectionArtSrc(null)).toBeNull();
    expect(collectionArtSrc("missing.webp")).toBeNull();
  });
});

describe("pairingArtSrc", () => {
  it("returns pairing heroes when listed", () => {
    expect(pairingArtSrc("pair-curry.webp")).toBe("/brand-art/pairings/pair-curry.webp");
    expect(pairingArtSrc("pair-donburi.webp")).toBe("/brand-art/pairings/pair-donburi.webp");
    expect(pairingArtSrc("missing.webp")).toBeNull();
  });
});

describe("mastheadArtSrc", () => {
  it("points at the masthead webp", () => {
    expect(mastheadArtSrc()).toBe("/brand-art/masthead.webp");
  });
});

describe("resolveBrandArt", () => {
  it("marks region fallbacks", () => {
    expect(resolveBrandArt("musubi-no-kami", "東海・北陸")).toEqual({
      kind: "region",
      src: "/brand-art/regions/tokai-hokuriku.webp",
      regionId: "tokai-hokuriku",
    });
  });
});

describe("distinctReading", () => {
  it("hides reading when it matches the name", () => {
    expect(distinctReading("ひとめぼれ", "ひとめぼれ")).toBeNull();
  });

  it("keeps reading when it differs", () => {
    expect(distinctReading("ゆめぴりか", "ゆめぴりか")).toBeNull();
    expect(distinctReading("コシヒカリ（魚沼産）", "こしひかり うおぬまさん")).toBe(
      "こしひかり うおぬまさん"
    );
  });
});
