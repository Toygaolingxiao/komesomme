/**
 * Canonical public origin for metadata, sitemap, and OG URLs.
 * Prefer `NEXT_PUBLIC_SITE_URL` (custom domain). Fall back to Vercel hostnames.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${stripTrailingSlash(production)}`;

  const deployment = process.env.VERCEL_URL?.trim();
  if (deployment) return `https://${stripTrailingSlash(deployment)}`;

  return "http://localhost:3000";
}

export function siteMetadataBase(): URL {
  return new URL(`${getSiteUrl()}/`);
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
