import { describe, expect, it } from "vitest";
import { analyticsLayerEntry, gtagEventParams } from "@/lib/analytics/layer";

describe("analyticsLayerEntry", () => {
  it("fills page_path from the location when the payload omits it", () => {
    expect(analyticsLayerEntry("rakuten_click", { rice_id: "koshihikari" }, "/library")).toEqual({
      event: "rakuten_click",
      rice_id: "koshihikari",
      page_path: "/library",
    });
  });

  it("keeps an explicit page_path on SPA page_view", () => {
    expect(
      analyticsLayerEntry("page_view", { page_path: "/discover", has_query: false }, "/")
    ).toEqual({
      event: "page_view",
      page_path: "/discover",
      has_query: false,
    });
  });
});

describe("gtagEventParams", () => {
  it("sends page_view as GA4 page_path / page_title only", () => {
    expect(
      gtagEventParams(
        "page_view",
        { page_path: "/library", page_title: "ライブラリ", has_query: true },
        "/"
      )
    ).toEqual({
      page_path: "/library",
      page_title: "ライブラリ",
    });
  });
});
