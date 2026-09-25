import { describe, expect, it } from "vitest";
import {
  legacyBrandRedirects,
  pathAliasRedirects,
  seoRedirects,
  wwwToApexRedirects,
} from "./legacyRedirects";

describe("wwwToApexRedirects", () => {
  it("sends www host to the apex origin in one hop", () => {
    const rules = wwwToApexRedirects();
    expect(rules.every((row) => row.permanent)).toBe(true);
    expect(rules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/",
          destination: "https://komesomme.jp/",
          has: [{ type: "host", value: "www.komesomme.jp" }],
        }),
        expect.objectContaining({
          source: "/:path*",
          destination: "https://komesomme.jp/:path*",
        }),
      ])
    );
  });
});

describe("pathAliasRedirects", () => {
  it("collapses trailing-slash aliases onto the canonical path", () => {
    const bySource = Object.fromEntries(pathAliasRedirects().map((row) => [row.source, row]));
    expect(bySource["/collections"]?.destination).toBe("/discover");
    expect(bySource["/collections/"]?.destination).toBe("/discover");
    expect(bySource["/library/collections/:slug"]?.destination).toBe("/collections/:slug");
    expect(bySource["/library/collections/:slug/"]?.destination).toBe("/collections/:slug");
  });
});

describe("legacyBrandRedirects", () => {
  it("maps /id and /id/ to /library/id without an extra slash hop", () => {
    const rules = legacyBrandRedirects(["yumepirika", "koshihikari-uonuma"]);
    expect(rules).toEqual([
      { source: "/yumepirika", destination: "/library/yumepirika", permanent: true },
      { source: "/yumepirika/", destination: "/library/yumepirika", permanent: true },
      {
        source: "/koshihikari-uonuma",
        destination: "/library/koshihikari-uonuma",
        permanent: true,
      },
      {
        source: "/koshihikari-uonuma/",
        destination: "/library/koshihikari-uonuma",
        permanent: true,
      },
    ]);
  });
});

describe("seoRedirects", () => {
  it("lists www rules before path aliases so host hops win first", () => {
    const rules = seoRedirects(["yumepirika"]);
    expect(rules[0]?.has?.[0]?.value).toBe("www.komesomme.jp");
    expect(rules.some((row) => row.source === "/yumepirika/")).toBe(true);
  });
});
