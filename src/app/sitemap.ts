import type { MetadataRoute } from "next";
import { encyclopediaManifest } from "@/data/rice/encyclopedia/load";
import { EDITORIAL_COLLECTIONS } from "@/data/editorial/collections";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteUrl();
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/library",
    "/discover",
    "/collections",
    "/privacy",
    "/terms",
    "/tokushoho",
  ].map((path) => ({
    url: `${origin}${path || "/"}`,
    lastModified,
    changeFrequency:
      path === "" || path === "/library" || path === "/discover" || path === "/collections"
        ? "weekly"
        : "yearly",
    priority:
      path === ""
        ? 1
        : path === "/library" || path === "/discover" || path === "/collections"
          ? 0.8
          : 0.3,
  }));

  const collections: MetadataRoute.Sitemap = EDITORIAL_COLLECTIONS.map((row) => ({
    url: `${origin}/collections/${encodeURIComponent(row.slug)}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  /** Canonical brand URLs live under /library/[id]. Legacy /{id} redirects permanently. */
  const libraryArticles: MetadataRoute.Sitemap = encyclopediaManifest().map((entry) => ({
    url: `${origin}/library/${encodeURIComponent(entry.id)}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...collections, ...libraryArticles];
}
