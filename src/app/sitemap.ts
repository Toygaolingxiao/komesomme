import type { MetadataRoute } from "next";
import { encyclopediaManifest } from "@/data/rice/encyclopedia/load";
import { EDITORIAL_COLLECTIONS } from "@/data/editorial/collections";
import { PAIRING_PAGES } from "@/data/editorial/pairings";
import { COMPARISON_PAGES } from "@/data/editorial/comparisons";
import { PREFECTURE_PAGES } from "@/lib/editorial/prefectures";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteUrl();
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/library",
    "/discover",
    "/pair",
    "/compare",
    "/shindan",
    "/prefectures",
    "/about",
    "/ratings",
    "/privacy",
    "/terms",
    "/tokushoho",
  ].map((path) => ({
    url: `${origin}${path || "/"}`,
    lastModified,
    changeFrequency:
      path === "" ||
      path === "/library" ||
      path === "/discover" ||
      path === "/pair" ||
      path === "/compare" ||
      path === "/shindan" ||
      path === "/prefectures"
        ? "weekly"
        : "yearly",
    priority:
      path === ""
        ? 1
        : path === "/library" ||
            path === "/discover" ||
            path === "/pair" ||
            path === "/compare" ||
            path === "/shindan" ||
            path === "/prefectures"
          ? 0.8
          : 0.3,
  }));

  const prefectures: MetadataRoute.Sitemap = PREFECTURE_PAGES.map((page) => ({
    url: `${origin}/prefectures/${encodeURIComponent(page.slug)}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const collections: MetadataRoute.Sitemap = EDITORIAL_COLLECTIONS.map(
    (row) => ({
      url: `${origin}/collections/${encodeURIComponent(row.slug)}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.65,
    }),
  );

  const comparisons: MetadataRoute.Sitemap = COMPARISON_PAGES.map((row) => ({
    url: `${origin}/compare/${encodeURIComponent(row.slug)}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  const pairings: MetadataRoute.Sitemap = PAIRING_PAGES.map((row) => ({
    url: `${origin}/pair/${encodeURIComponent(row.slug)}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  /** Canonical brand URLs live under /library/[id]. Legacy /{id} redirects permanently. */
  const libraryArticles: MetadataRoute.Sitemap = encyclopediaManifest().map(
    (entry) => ({
      url: `${origin}/library/${encodeURIComponent(entry.id)}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    }),
  );

  return [
    ...staticRoutes,
    ...collections,
    ...pairings,
    ...comparisons,
    ...prefectures,
    ...libraryArticles,
  ];
}
