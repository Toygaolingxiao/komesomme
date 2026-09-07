import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

/**
 * Baseline response headers for a public Vercel deployment.
 * CSP is deferred until we know exact third-party script hosts (GTM / Sentry).
 */
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

/** Fingerprinted deploy assets + editorial art: long CDN / browser cache. */
const immutableAssetCache = [
  {
    key: "Cache-Control",
    value: "public, max-age=31536000, immutable",
  },
];

/** Next image optimizer output — keep warm across visits. */
const optimizedImageCache = [
  {
    key: "Cache-Control",
    value: "public, max-age=2592000, stale-while-revalidate=86400",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    /** Cache optimized variants for 30 days (source files change with deploys). */
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 750, 828, 1080, 1200, 1280, 1440],
    imageSizes: [64, 96, 128, 160, 200, 256, 320, 384],
  },
  async redirects() {
    return [
      {
        source: "/library/collections/:slug",
        destination: "/collections/:slug",
        permanent: true,
      },
      {
        /** Index lives under ピックアップ; magazine pages stay at /collections/[slug]. */
        source: "/collections",
        destination: "/discover",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/brand-art/:path*",
        headers: immutableAssetCache,
      },
      {
        source: "/_next/static/:path*",
        headers: immutableAssetCache,
      },
      {
        source: "/_next/image",
        headers: optimizedImageCache,
      },
    ];
  },
};

const sentryAuth = process.env.SENTRY_AUTH_TOKEN?.trim();

export default sentryAuth
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: true,
      sourcemaps: { disable: false },
      disableLogger: true,
    })
  : nextConfig;
