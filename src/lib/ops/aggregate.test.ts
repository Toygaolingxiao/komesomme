import { describe, expect, it } from "vitest";
import {
  aggregateAccessEvents,
  kpiDelta,
  tokyoDayKey,
  type OpsEventRow,
} from "@/lib/ops/aggregate";

const OPTS = {
  since: new Date("2026-08-25T00:00:00.000Z"),
  until: new Date("2026-08-31T12:00:00.000Z"),
  truncated: false,
};

function row(
  event: string,
  path: string | null,
  session_id: string | null,
  meta: unknown = {},
  minute = 0
): OpsEventRow {
  return {
    event,
    created_at: new Date(Date.UTC(2026, 7, 30, 10, minute)).toISOString(),
    path,
    session_id,
    meta,
  };
}

describe("aggregateAccessEvents", () => {
  it("builds funnel kpis, JST days, and furusato channel split", () => {
    const rows: OpsEventRow[] = [
      {
        event: "page_view",
        created_at: "2026-08-30T10:00:00.000Z",
        path: "/",
        session_id: "s1",
        meta: {},
      },
      {
        event: "page_view",
        created_at: "2026-08-30T11:00:00.000Z",
        path: "/library",
        session_id: "s2",
        meta: {},
      },
      {
        event: "map_marker_click",
        created_at: "2026-08-30T10:01:00.000Z",
        path: "/",
        session_id: "s1",
        meta: { id: "yumepirika" },
      },
      {
        event: "shop_disclosure_toggle",
        created_at: "2026-08-30T10:02:00.000Z",
        path: "/",
        session_id: "s1",
        meta: { open: true },
      },
      {
        event: "rakuten_click",
        created_at: "2026-08-30T10:03:00.000Z",
        path: "/",
        session_id: "s1",
        meta: {},
      },
      {
        event: "furusato_click",
        created_at: "2026-08-30T10:04:00.000Z",
        path: "/",
        session_id: "s1",
        meta: { label: "さとふるで探す" },
      },
      {
        event: "language_search_submit",
        created_at: "2026-08-31T09:00:00.000Z",
        path: "/",
        session_id: "s2",
        meta: {},
      },
    ];

    const summary = aggregateAccessEvents(rows, "7d", {
      since: new Date("2026-08-25T00:00:00.000Z"),
      until: new Date("2026-08-31T12:00:00.000Z"),
      truncated: false,
    });

    expect(summary.timezone).toBe("Asia/Tokyo");
    expect(summary.kpis.sessions).toBe(2);
    expect(summary.kpis.pageViews).toBe(2);
    expect(summary.kpis.purchaseClicks).toBe(2);
    expect(summary.kpis.consultSubmits).toBe(1);
    expect(summary.kpis.shopOpens).toBe(1);
    expect(summary.rates.purchasePerView).toBe(1);
    expect(summary.channels.map((c) => c.id)).toContain("rakuten_click");
    expect(summary.retailChannels.find((c) => c.id === "rakuten_click")?.count).toBe(1);
    expect(summary.furusatoChannels.find((c) => c.id === "satofull")?.count).toBe(1);
    expect(summary.topPaths.map((p) => p.path).sort()).toEqual(["/", "/library"]);
    expect(tokyoDayKey("2026-08-30T16:00:00.000Z")).toBe("2026-08-31");
    expect(summary.byDay.some((d) => d.day === "2026-08-30" && d.pageViews === 2)).toBe(true);
    expect(summary.byDay.some((d) => d.day === "2026-08-31" && d.consults === 1)).toBe(true);
  });

  it("classifies page types and counts each funnel step per type", () => {
    const rows: OpsEventRow[] = [
      row("page_view", "/", "s1", {}, 0),
      row("map_marker_click", "/", "s1", {}, 1),
      row("shop_disclosure_toggle", "/", "s1", { open: true }, 2),
      row("page_view", "/discover", "s1", {}, 3),
      row("page_view", "/library", "s2", {}, 4),
      row("page_view", "/library/yumepirika", "s2", {}, 5),
      row("rakuten_click", "/library/yumepirika", "s2", {}, 6),
      row("language_search_submit", "/library/yumepirika", "s2", {}, 7),
      row("page_view", "/pair/curry", "s3", {}, 8),
      row("page_view", "/compare", "s3", {}, 9),
      row("page_view", "/prefectures/niigata", "s3", {}, 10),
      row("page_view", "/prefectures", "s3", {}, 11),
      row("page_view", "/collections/furusato-nozei", "s4", {}, 12),
      row("page_view", "/mystery", "s4", {}, 13),
      row("page_view", null, "s4", {}, 14),
      row("page_view", "/library/a/b", "s4", {}, 15),
    ];

    const summary = aggregateAccessEvents(rows, "7d", OPTS);
    const byId = new Map(summary.pageTypes.map((t) => [t.id, t]));

    expect(byId.get("home")).toMatchObject({ views: 1, explore: 1, shopOpens: 1 });
    expect(byId.get("discover")?.views).toBe(1);
    expect(byId.get("library")?.views).toBe(1);
    expect(byId.get("brand")).toMatchObject({ views: 1, purchaseClicks: 1, consults: 1 });
    expect(byId.get("brand")?.purchasePerView).toBe(1);
    expect(byId.get("pair")?.views).toBe(1);
    expect(byId.get("compare")?.views).toBe(1);
    expect(byId.get("prefecture")?.views).toBe(2);
    expect(byId.get("collection")?.views).toBe(1);
    // /mystery, null path, and the nested /library/a/b all fall to other.
    expect(byId.get("other")?.views).toBe(3);
    // Sorted by views desc: prefecture and other (3, 2)... other first.
    expect(summary.pageTypes[0].id).toBe("other");
    expect(summary.pageTypes[1].id).toBe("prefecture");
  });

  it("omits page types with zero views and zero activity", () => {
    const summary = aggregateAccessEvents([row("page_view", "/", "s1")], "7d", OPTS);
    expect(summary.pageTypes.map((t) => t.id)).toEqual(["home"]);
  });

  it("attributes sources by first-touch: utm wins, referrer host next, direct last", () => {
    const rows: OpsEventRow[] = [
      // Session a: utm on the landing view wins over its referrer, and a later
      // view carrying a different utm must not override the first touch.
      row("page_view", "/", "a", { utm_source: "x_post", referrer: "https://google.com/" }, 0),
      row("page_view", "/library", "a", { utm_source: "newsletter" }, 1),
      // Session b: no utm, referrer stored as origin+path -> host only.
      row("page_view", "/", "b", { referrer: "https://www.google.com/search" }, 2),
      row("page_view", "/discover", "b", {}, 3),
      // Session c: empty-string utm falls through to the referrer.
      row("page_view", "/", "c", { utm_source: "", referrer: "https://duckduckgo.com/?q=rice" }, 4),
      // Session d: nothing at all -> direct.
      row("page_view", "/", "d", {}, 5),
      // A session with no page_view is never attributed.
      row("rakuten_click", "/", "e", { utm_source: "x_post" }, 6),
    ];

    const summary = aggregateAccessEvents(rows, "7d", OPTS);
    const byId = new Map(summary.sources.map((s) => [s.id, s]));

    expect(byId.get("x_post")).toMatchObject({ label: "x_post", sessions: 1, views: 2 });
    expect(byId.get("www.google.com")).toMatchObject({ sessions: 1, views: 2 });
    expect(byId.get("duckduckgo.com")).toMatchObject({ sessions: 1, views: 1 });
    expect(byId.get("direct")).toMatchObject({ label: "直接访问", sessions: 1, views: 1 });
    expect(summary.sources).toHaveLength(4);
    expect(summary.sources.every((s) => s.sessions === 1)).toBe(true);
  });

  it("ranks brands by purchase clicks, then views", () => {
    const rows: OpsEventRow[] = [
      row("page_view", "/library/alpha", "s1", {}, 0),
      row("page_view", "/library/alpha", "s1", {}, 1),
      row("amazon_click", "/library/alpha", "s1", {}, 2),
      row("page_view", "/library/beta", "s2", {}, 3),
      row("page_view", "/library/beta", "s2", {}, 4),
      row("page_view", "/library/beta", "s2", {}, 5),
      row("rakuten_click", "/library/beta", "s2", {}, 6),
      row("yahoo_click", "/library/beta", "s2", {}, 7),
      row("page_view", "/library/gamma", "s3", {}, 8),
      row("page_view", "/library/gamma", "s3", {}, 9),
      row("page_view", "/library/gamma", "s3", {}, 10),
      row("page_view", "/library/gamma", "s3", {}, 11),
      row("page_view", "/library/gamma", "s3", {}, 12),
      // The library index and nested paths are not brands.
      row("page_view", "/library", "s3", {}, 13),
      row("rakuten_click", "/library/a/b", "s3", {}, 14),
    ];

    const summary = aggregateAccessEvents(rows, "7d", OPTS);
    expect(summary.topBrands.map((b) => b.id)).toEqual(["beta", "alpha", "gamma"]);
    expect(summary.topBrands[0]).toMatchObject({ views: 3, purchaseClicks: 2 });
    expect(summary.topBrands[2]).toMatchObject({ views: 5, purchaseClicks: 0 });
  });
  it("counts landing pages by each session's earliest page_view", () => {
    const rows: OpsEventRow[] = [
      // Session a lands on a brand page, then navigates home: landing stays the brand page.
      row("page_view", "/library/yumepirika", "a", {}, 0),
      row("page_view", "/", "a", {}, 1),
      // Session b lands home.
      row("page_view", "/", "b", {}, 2),
      row("page_view", "/library", "b", {}, 3),
      // Session c also lands home; a viewless session never lands anywhere.
      row("page_view", "/", "c", {}, 4),
      row("rakuten_click", "/", "d", {}, 5),
    ];

    const summary = aggregateAccessEvents(rows, "7d", OPTS);
    expect(summary.landingPages).toEqual([
      { path: "/", sessions: 2 },
      { path: "/library/yumepirika", sessions: 1 },
    ]);
  });

  it("ranks content leaders per slug and excludes the index paths", () => {
    const rows: OpsEventRow[] = [
      row("page_view", "/pair/curry", "s1", {}, 0),
      row("page_view", "/pair/curry", "s2", {}, 1),
      row("rakuten_click", "/pair/curry", "s1", {}, 2),
      row("page_view", "/pair/nabe", "s1", {}, 3),
      // Index pages are not leaders.
      row("page_view", "/pair", "s1", {}, 4),
      row("page_view", "/prefectures/niigata", "s3", {}, 5),
      row("page_view", "/prefectures/niigata", "s3", {}, 6),
      row("page_view", "/prefectures/niigata", "s4", {}, 7),
      row("amazon_click", "/prefectures/niigata", "s3", {}, 8),
      row("yahoo_click", "/prefectures/niigata", "s4", {}, 9),
      row("page_view", "/prefectures", "s3", {}, 10),
      row("page_view", "/collections/furusato-nozei", "s5", {}, 11),
    ];

    const summary = aggregateAccessEvents(rows, "7d", OPTS);
    expect(summary.leaders.pair).toEqual([
      { slug: "curry", views: 2, purchaseClicks: 1 },
      { slug: "nabe", views: 1, purchaseClicks: 0 },
    ]);
    expect(summary.leaders.prefecture).toEqual([
      { slug: "niigata", views: 3, purchaseClicks: 2 },
    ]);
    expect(summary.leaders.collection).toEqual([
      { slug: "furusato-nozei", views: 1, purchaseClicks: 0 },
    ]);
    expect(summary.leaders.compare).toEqual([]);
  });

  it("tallies shares by kind and parses the shared brand from the path", () => {
    const rows: OpsEventRow[] = [
      row("share_card_download", "/library/yumepirika", "s1", {}, 0),
      row("share_card_download", "/library/yumepirika", "s2", {}, 1),
      row("share_card_native", "/library/yumepirika", "s3", {}, 2),
      row("share_card_copy_link", "/library/koshihikari", "s4", {}, 3),
      // A share from a non-brand page counts toward the total and its kind only.
      row("share_fallback", "/pair/curry", "s5", {}, 4),
      // Unrelated events are not shares.
      row("page_view", "/library/yumepirika", "s1", {}, 5),
    ];

    const summary = aggregateAccessEvents(rows, "7d", OPTS);
    expect(summary.shares.total).toBe(5);
    expect(summary.shares.byKind).toEqual([
      { id: "share_card_download", label: "下载", count: 2 },
      { id: "share_card_native", label: "系统分享", count: 1 },
      { id: "share_card_copy_link", label: "复制链接", count: 1 },
      { id: "share_fallback", label: "兜底", count: 1 },
    ]);
    expect(summary.shares.topBrands).toEqual([
      { id: "yumepirika", count: 3 },
      { id: "koshihikari", count: 1 },
    ]);
  });
});

describe("kpiDelta", () => {
  it("returns the ratio change against the previous window", () => {
    expect(kpiDelta(110, 100)).toBeCloseTo(0.1);
    expect(kpiDelta(50, 100)).toBe(-0.5);
    expect(kpiDelta(100, 100)).toBe(0);
  });

  it("returns null when the previous window is zero", () => {
    expect(kpiDelta(10, 0)).toBeNull();
    expect(kpiDelta(0, 0)).toBeNull();
  });
});
