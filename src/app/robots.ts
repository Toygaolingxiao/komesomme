import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

const DISALLOW = ["/api/", "/ops", "/ops/", "/prototypes", "/prototypes/"];

/**
 * AI search and retrieval crawlers get the same access as everyone else,
 * stated explicitly so a future blocklist change upstream (e.g. Cloudflare
 * managed robots) cannot silently shut them out. This lists search and
 * retrieval agents only: training crawlers (GPTBot, ClaudeBot, CCBot, …)
 * are disallowed via Cloudflare's managed robots content and stay unlisted
 * here. See docs/23-ai-search-geo.md for the reasoning.
 */
const AI_SEARCH_AGENTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Claude-SearchBot",
  "Claude-User",
];

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      {
        userAgent: AI_SEARCH_AGENTS,
        allow: "/",
        disallow: DISALLOW,
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
