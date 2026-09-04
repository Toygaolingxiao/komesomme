import { describe, expect, it } from "vitest";
import { EDITORIAL_COLLECTIONS } from "@/data/editorial/collections";
import {
  allCollections,
  collectionBySlug,
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

  it("indexes September features before the rest", () => {
    const september = Date.UTC(2026, 8, 3, 3, 0);
    expect(collectionsForIndex(KNOWN, september).map((row) => row.slug)).toEqual([
      "bento-cold",
      "shinmai",
      "nabe",
    ]);
  });

  it("prints nabe's first-ship date, not a future November", () => {
    const nabe = EDITORIAL_COLLECTIONS.find((row) => row.slug === "nabe");
    expect(nabe?.dateLabel).toBe("2026年9月3日 18時53分");
  });

  it("prints bento's date in September, not a fake April", () => {
    const bento = EDITORIAL_COLLECTIONS.find((row) => row.slug === "bento-cold");
    expect(bento?.dateLabel).toBe("2026年9月2日 0時02分");
  });
});
