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
  "sakihokore",
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

  it("indexes most recently updated first (updatedLabel wins over dateLabel)", () => {
    expect(collectionsForIndex(KNOWN).map((row) => row.slug)).toEqual([
      "nabe",
      "shinmai",
      "yakizakana",
      "jugatsu-wase",
      "shio-musubi",
      "toku-a",
      "bento-cold",
    ]);
  });

  it("features the two freshest October collections", () => {
    const october = Date.UTC(2026, 9, 24, 3, 0);
    expect(featuredCollections(KNOWN, october).map((row) => row.slug)).toEqual([
      "shinmai",
      "yakizakana",
    ]);
  });

  it("prints nabe's first-ship date, not a future November", () => {
    const nabe = EDITORIAL_COLLECTIONS.find((row) => row.slug === "nabe");
    expect(nabe?.dateLabel).toBe("2026年9月3日 18時53分");
    expect(nabe?.updatedLabel).toBe("2026年10月25日 18時53分");
    expect(collectionPublishedIso(nabe?.updatedLabel ?? "")).toBe("2026-10-25T18:53:00+09:00");
    expect(nabe?.months).toEqual([11, 12, 1, 2]);
    expect(nabe?.riceIds).toContain("nijinokirameki");
    expect(nabe?.riceNotes?.nijinokirameki).toBe("汁気のある料理でも形が崩れにくいお米です。");
    expect(nabe?.body.join("")).toBe(
      "鍋のあとの雑炊や、取り分けた具をごはんにのせる日。汁を吸ってもべちゃっとしにくい、粒のしっかりした銘柄を中心に選びました。甘みの強い銘柄とすっきりした銘柄を両方置いているので、寄せ鍋やキムチ鍋など、その日の味の濃さで選んでください。"
    );
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
      if (row.updatedLabel) {
        expect(collectionPublishedIso(row.updatedLabel)).toBeDefined();
      }
    }
  });

  it("parses shinmai's updatedLabel without moving the publish date", () => {
    const shinmai = EDITORIAL_COLLECTIONS.find((row) => row.slug === "shinmai");
    expect(shinmai?.dateLabel).toBe("2026年9月3日 16時48分");
    expect(shinmai?.updatedLabel).toBe("2026年10月25日 16時48分");
    expect(collectionPublishedIso(shinmai?.updatedLabel ?? "")).toBe("2026-10-25T16:48:00+09:00");
    const memo = shinmai?.sections?.find((section) => section.heading === "今年の新米メモ");
    const emi = memo?.items.find((item) => item.includes("えみほころ"));
    expect(emi).toContain("[えみほころ](/library/emihokoro)");
    expect(emi).toContain(
      "（出典：埼玉県「[“えみほころ”で食欲の秋を楽しもう！](https://www.pref.saitama.lg.jp/a0314/sainokuni/sainokuni-kensei-202610p02.html)」2026年10月1日）"
    );
    expect(memo?.items.find((item) => item.includes("2,821円"))).toContain("2,821円");
    const keys = (shinmai?.body ?? []).map((paragraph) => paragraph.slice(0, 24));
    expect(new Set(keys).size).toBe(keys.length);
  });
});
