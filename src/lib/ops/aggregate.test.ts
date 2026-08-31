import { describe, expect, it } from "vitest";
import { aggregateAccessEvents, tokyoDayKey, type OpsEventRow } from "@/lib/ops/aggregate";

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
});
