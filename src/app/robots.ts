import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/ops", "/ops/", "/prototypes", "/prototypes/"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
