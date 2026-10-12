import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { PairView } from "@/components/pair/PairView";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_COLUMN } from "@/components/siteChrome";
import { PAIRING_PAGES } from "@/data/editorial/pairings";
import { resolvePairingBySlug } from "@/lib/editorial/pairings";
import {
  articleLd,
  breadcrumbListLd,
  faqPageLd,
  itemListLd,
  type SeoLink,
} from "@/lib/seo/jsonLd";

type PageProps = {
  params: Promise<{ dish: string }>;
};

function crumbs(dishLabel: string, slug: string): SeoLink[] {
  return [
    { name: "トップ", path: "/" },
    { name: "料理で選ぶ", path: "/pair" },
    { name: `${dishLabel}に合う米`, path: `/pair/${slug}` },
  ];
}

export function generateStaticParams() {
  return PAIRING_PAGES.map((page) => ({ dish: page.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { dish } = await params;
  const resolved = resolvePairingBySlug(dish);
  if (!resolved) return { title: "ページが見つかりません" };

  const { page } = resolved;
  return {
    title: page.title,
    description: page.dek,
    alternates: { canonical: `/pair/${page.slug}` },
    openGraph: {
      title: `${page.dishLabel}に合う米`,
      description: page.dek,
      type: "article",
      locale: "ja_JP",
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.dishLabel}に合う米`,
      description: page.dek,
    },
  };
}

export default async function PairDishPage({ params }: PageProps) {
  const { dish } = await params;
  const resolved = resolvePairingBySlug(dish);
  if (!resolved) notFound();

  const { page, top } = resolved;
  const trail = crumbs(page.dishLabel, page.slug);
  const published = "2026-09-09T00:00:00.000Z";

  return (
    <main className="min-h-[100dvh] w-full min-w-0 text-[var(--km-ink)]">
      <JsonLd
        data={[
          articleLd({
            headline: page.title,
            description: page.dek,
            path: `/pair/${page.slug}`,
            imagePath: `/pair/${page.slug}/opengraph-image`,
            datePublished: published,
          }),
          breadcrumbListLd(trail),
          faqPageLd(page.faq),
          itemListLd({
            name: `${page.dishLabel}向きの銘柄`,
            items: top.map((rice) => ({
              name: rice.name,
              path: `/library/${rice.id}`,
            })),
          }),
        ]}
      />
      <SiteHeader active="pair" />
      <Breadcrumbs className={`${SITE_COLUMN} pt-5`} crumbs={trail} />
      <PairView resolved={resolved} />
      <SiteFooter />
    </main>
  );
}
