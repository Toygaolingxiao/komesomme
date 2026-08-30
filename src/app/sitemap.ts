import type { MetadataRoute } from "next";
import { encyclopediaManifest } from "@/data/rice/encyclopedia/load";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteUrl();
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/library",
    "/privacy",
    "/terms",
    "/tokushoho",
  ].map((path) => ({
    url: `${origin}${path || "/"}`,
    lastModified,
    changeFrequency: path === "" || path === "/library" ? "weekly" : "yearly",
    priority: path === "" ? 1 : path === "/library" ? 0.8 : 0.3,
  }));

  /** Canonical brand URLs live under /library/[id]. Legacy /{id} redirects permanently. */
  const libraryArticles: MetadataRoute.Sitemap = encyclopediaManifest().map((entry) => ({
    url: `${origin}/library/${encodeURIComponent(entry.id)}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...libraryArticles];
}
