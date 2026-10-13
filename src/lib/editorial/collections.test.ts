import { describe, expect, it } from "vitest";
import { EDITORIAL_COLLECTIONS } from "@/data/editorial/collections";
import {
  allCollections,
  collectionBySlug,
  collectionPublishedIso,
  collectionsForIndex,
  featuredCollections,
} from "@/lib/editorial/collections";

const KNOWN = new Set([
  "sasanishiki",
  "hitomebore",
  "nanatsuboshi",
  "milky-queen",
  "haenuki",
  "yumepirika",
  "koshihikari-uonuma",
  "tsuyahime",
  "tentakaku",
  "akitakomachi",
  "sagabiyori",
  "seiten-no-hekireki",
  "ryu-no-hitomi",
  "nitamai",
  "hazuki-minori",
  "hanaechizen",
  "yumemizuho",
  "fusakogane",
  "koshiibuki",
]);

describe("editorial collections", () => {
  it("keeps only ids present in the known set", () => {
    const slim = new Set(["yumepirika"]);
    const shinmai = collectionBySlug("shinmai", slim);
    expect(shinmai?.riceIds).toEqual(["yumepirika"]);
  });

  it("returns null for an unknown slug", () => {
    expect(collectionBySlug("no-such", KNOWN)).toBeNull();
  });

  it("returns null when every rice id is unknown", () => {
    expect(collectionBySlug("shinmai", new Set(["missing"]))).toBeNull();
  });

  it("features shinmai in September Tokyo time", () => {
    const september = Date.UTC(2026, 8, 3, 3, 0);
    const slugs = featuredCollections(KNOWN, september).map((row) => row.slug);
    expect(slugs).toContain("shinmai");
    expect(slugs.length).toBeLessThanOrEqual(2);
  });

  it("does not feature nabe in September", () => {
    const september = Date.UTC(2026, 8, 3, 3, 0);
    expect(featuredCollections(KNOWN, september).map((row) => row.slug)).not.toContain("nabe");
  });

  it("lists every hand-edited slug", () => {
    expect(allCollections(KNOWN).map((row) => row.slug).sort()).toEqual(
      EDITORIAL_COLLECTIONS.map((row) => row.slug).sort()
    );
  });

  it("indexes newest dateLabel first", () => {
    expect(collectionsForIndex(KNOWN).map((row) => row.slug)).toEqual([
      "jugatsu-wase",
      "shio-musubi",
      "toku-a",
      "nabe",
      "shinmai",
      "bento-cold",
    ]);
  });

  it("features jugatsu-wase ahead of shio-musubi in October", () => {
    const october = Date.UTC(2026, 9, 12, 8, 0);
    expect(featuredCollections(KNOWN, october).map((row) => row.slug)).toEqual([
      "jugatsu-wase",
      "shio-musubi",
    ]);
  });

  it("prints jugatsu-wase's first-ship date", () => {
    const row = EDITORIAL_COLLECTIONS.find((item) => item.slug === "jugatsu-wase");
    expect(row?.dateLabel).toBe("2026年10月12日 22時08分");
  });

  it("prints shio-musubi's first-ship date", () => {
    const row = EDITORIAL_COLLECTIONS.find((item) => item.slug === "shio-musubi");
    expect(row?.dateLabel).toBe("2026年10月12日 17時10分");
  });

  it("prints nabe's first-ship date, not a future November", () => {
    const nabe = EDITORIAL_COLLECTIONS.find((row) => row.slug === "nabe");
    expect(nabe?.dateLabel).toBe("2026年9月3日 18時53分");
  });

  it("prints bento's date in September, not a fake April", () => {
    const bento = EDITORIAL_COLLECTIONS.find((row) => row.slug === "bento-cold");
    expect(bento?.dateLabel).toBe("2026年9月2日 0時02分");
  });

  it("prints toku-a's first-ship date", () => {
    const tokuA = EDITORIAL_COLLECTIONS.find((row) => row.slug === "toku-a");
    expect(tokuA?.dateLabel).toBe("2026年9月5日 1時45分");
  });

  it("features toku-a when the ranking is news", () => {
    const february = Date.UTC(2026, 1, 27, 3, 0);
    expect(featuredCollections(KNOWN, february).map((row) => row.slug)).toContain("toku-a");
  });
});

describe("collectionPublishedIso", () => {
  it("reads a Tokyo label into ISO 8601 with the +09:00 offset", () => {
    expect(collectionPublishedIso("2026年9月2日 0時02分")).toBe("2026-09-02T00:02:00+09:00");
  });

  it("pads two-digit months and days", () => {
    expect(collectionPublishedIso("2026年11月10日 18時53分")).toBe(
      "2026-11-10T18:53:00+09:00"
    );
  });

  it("falls back to midnight when the label has no time", () => {
    expect(collectionPublishedIso("2026年9月5日")).toBe("2026-09-05T00:00:00+09:00");
  });

  it("gives up on an unexpected shape", () => {
    expect(collectionPublishedIso("2026/09/05")).toBeUndefined();
  });

  it("parses every shipped collection label", () => {
    for (const row of EDITORIAL_COLLECTIONS) {
      expect(collectionPublishedIso(row.dateLabel)).toBeDefined();
    }
  });
});
