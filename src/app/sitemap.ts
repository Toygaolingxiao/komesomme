import type { MetadataRoute } from "next";
import { riceProfiles } from "@/data/rice/catalog";
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

  const brands: MetadataRoute.Sitemap = riceProfiles.map((rice) => ({
    url: `${origin}/${encodeURIComponent(rice.id)}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const libraryArticles: MetadataRoute.Sitemap = encyclopediaManifest().map((entry) => ({
    url: `${origin}/library/${encodeURIComponent(entry.id)}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...brands, ...libraryArticles];
}
