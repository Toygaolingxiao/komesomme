import type { MetadataRoute } from "next";
import { riceProfiles } from "@/data/rice/catalog";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteUrl();
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = ["", "/privacy", "/terms", "/tokushoho"].map(
    (path) => ({
      url: `${origin}${path || "/"}`,
      lastModified,
      changeFrequency: path === "" ? "weekly" : "yearly",
      priority: path === "" ? 1 : 0.3,
    })
  );

  const brands: MetadataRoute.Sitemap = riceProfiles.map((rice) => ({
    url: `${origin}/${encodeURIComponent(rice.id)}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...brands];
}
