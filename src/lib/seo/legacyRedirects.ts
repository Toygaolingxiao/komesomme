/**
 * Permanent redirects for Search Console.
 * Keep www → apex, trailing-slash aliases, and legacy /{id} as a single hop
 * to the canonical path. Do not import the rice catalog here — next.config
 * cannot resolve `@/` aliases.
 */

export type SeoRedirect = {
  source: string;
  destination: string;
  permanent: true;
  has?: Array<{ type: "host"; value: string }>;
};

const APEX = "https://komesomme.jp";
const WWW_HOST = "www.komesomme.jp";

export function wwwToApexRedirects(): SeoRedirect[] {
  return [
    {
      source: "/",
      has: [{ type: "host", value: WWW_HOST }],
      destination: `${APEX}/`,
      permanent: true,
    },
    {
      source: "/:path*",
      has: [{ type: "host", value: WWW_HOST }],
      destination: `${APEX}/:path*`,
      permanent: true,
    },
  ];
}

export function pathAliasRedirects(): SeoRedirect[] {
  return [
    {
      source: "/collections",
      destination: "/discover",
      permanent: true,
    },
    {
      source: "/collections/",
      destination: "/discover",
      permanent: true,
    },
    {
      source: "/library/collections/:slug",
      destination: "/collections/:slug",
      permanent: true,
    },
    {
      source: "/library/collections/:slug/",
      destination: "/collections/:slug",
      permanent: true,
    },
  ];
}

/** Legacy /{id} and /{id}/ both land on /library/{id} without a slash hop. */
export function legacyBrandRedirects(brandIds: string[]): SeoRedirect[] {
  return brandIds.flatMap((id) => [
    {
      source: `/${id}`,
      destination: `/library/${id}`,
      permanent: true,
    },
    {
      source: `/${id}/`,
      destination: `/library/${id}`,
      permanent: true,
    },
  ]);
}

export function seoRedirects(brandIds: string[]): SeoRedirect[] {
  return [...wwwToApexRedirects(), ...pathAliasRedirects(), ...legacyBrandRedirects(brandIds)];
}
