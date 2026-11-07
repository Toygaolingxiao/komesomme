import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { CompareView } from "@/components/compare/CompareView";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_COLUMN } from "@/components/siteChrome";
import { COMPARISON_PAGES } from "@/data/editorial/comparisons";
import { resolveComparisonBySlug } from "@/lib/editorial/comparisons";
import {
  articleLd,
  breadcrumbListLd,
  faqPageLd,
  type SeoLink,
} from "@/lib/seo/jsonLd";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function crumbs(aName: string, bName: string, slug: string): SeoLink[] {
  return [
    { name: "トップ", path: "/" },
    { name: "銘柄くらべ", path: "/compare" },
    { name: `${aName}と${bName}`, path: `/compare/${slug}` },
  ];
}

export function generateStaticParams() {
  return COMPARISON_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolveComparisonBySlug(slug);
  if (!resolved) return { title: "ページが見つかりません" };

  const { page, a, b } = resolved;
  return {
    title: page.title,
    description: page.dek,
    alternates: { canonical: `/compare/${page.slug}` },
    openGraph: {
      title: `${a.name}と${b.name}、どう違う？`,
      description: page.dek,
      type: "article",
      locale: "ja_JP",
    },
    twitter: {
      card: "summary_large_image",
      title: `${a.name}と${b.name}、どう違う？`,
      description: page.dek,
    },
  };
}

export default async function ComparePage({ params }: PageProps) {
  const { slug } = await params;
  const resolved = resolveComparisonBySlug(slug);
  if (!resolved) notFound();

  const { page, a, b } = resolved;
  const trail = crumbs(a.name, b.name, page.slug);
  const published = "2026-11-04T00:00:00.000Z";

  return (
    <main className="min-h-[100dvh] w-full min-w-0 text-[var(--km-ink)]">
      <JsonLd
        data={[
          articleLd({
            headline: page.title,
            description: page.dek,
            path: `/compare/${page.slug}`,
            imagePath: `/compare/${page.slug}/opengraph-image`,
            datePublished: published,
          }),
          breadcrumbListLd(trail),
          faqPageLd(page.faq),
        ]}
      />
      <SiteHeader active="compare" />
      <div className={`${SITE_COLUMN} pt-5`}>
        <Breadcrumbs crumbs={trail} />
      </div>
      <CompareView resolved={resolved} />
      <SiteFooter />
    </main>
  );
}
