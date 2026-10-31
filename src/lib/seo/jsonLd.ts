import { GUIDE_ROLE } from "@/lib/brand/guideRole";
import { getSiteUrl } from "@/lib/site";

/**
 * JSON-LD builders. Every helper is pure and takes the origin so it can be
 * unit tested without env. Render the result with `<JsonLd data={...} />`.
 */

export type JsonLdObject = Record<string, unknown>;

/** One trail / list entry. `path` is site-relative ("/library") or absolute. */
export type SeoLink = {
  name: string;
  path: string;
};

const CONTEXT = "https://schema.org";
const SITE_NAME = "KomeSomme";
const AUTHOR_NAME = "高江Takae";
const AUTHOR_SAME_AS = "https://x.com/Toy_Takae";

/** schema.org recommends keeping Article.headline within 110 characters. */
const HEADLINE_MAX = 110;

export function absoluteUrl(path: string, origin: string = getSiteUrl()): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = origin.replace(/\/+$/, "");
  const rest = path.replace(/^\/+/, "");
  return rest ? `${base}/${rest}` : base;
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function organization(origin: string): JsonLdObject {
  return {
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/", origin),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/icon", origin),
    },
  };
}

function personAuthor(origin: string): JsonLdObject {
  return {
    "@type": "Person",
    name: AUTHOR_NAME,
    url: absoluteUrl("/about", origin),
    sameAs: [AUTHOR_SAME_AS],
  };
}

export function websiteLd(description: string, origin: string = getSiteUrl()): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: ["コメソムメ", GUIDE_ROLE],
    url: absoluteUrl("/", origin),
    description,
    inLanguage: "ja-JP",
  };
}

export function breadcrumbListLd(crumbs: SeoLink[], origin: string = getSiteUrl()): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path, origin),
    })),
  };
}

export function articleLd(input: {
  headline: string;
  description: string;
  /** Site-relative path of the article itself. */
  path: string;
  /** Site-relative path of the representative 1200×630 image. */
  imagePath: string;
  datePublished?: string;
  dateModified?: string;
  origin?: string;
}): JsonLdObject {
  const origin = input.origin ?? getSiteUrl();
  const url = absoluteUrl(input.path, origin);
  const published = input.datePublished;
  const modified = input.dateModified ?? published;

  return {
    "@context": CONTEXT,
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline: truncate(input.headline, HEADLINE_MAX),
    description: input.description.trim(),
    image: [absoluteUrl(input.imagePath, origin)],
    inLanguage: "ja-JP",
    author: personAuthor(origin),
    publisher: organization(origin),
    ...(published ? { datePublished: published } : {}),
    ...(modified ? { dateModified: modified } : {}),
  };
}

export function itemListLd(input: {
  name: string;
  items: SeoLink[];
  origin?: string;
}): JsonLdObject {
  const origin = input.origin ?? getSiteUrl();
  return {
    "@context": CONTEXT,
    "@type": "ItemList",
    name: input.name,
    numberOfItems: input.items.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path, origin),
    })),
  };
}

export function faqPageLd(
  faqs: Array<{ q: string; a: string }>,
  origin: string = getSiteUrl()
): JsonLdObject {
  void origin;
  return {
    "@context": CONTEXT,
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q.trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a.trim(),
      },
    })),
  };
}
