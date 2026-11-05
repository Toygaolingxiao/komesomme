import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrefectureView } from "@/components/editorial/PrefectureView";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { READING_COLUMN, SITE_COLUMN } from "@/components/siteChrome";
import {
  PREFECTURE_PAGES,
  prefectureBySlug,
  prefectureLede,
} from "@/lib/editorial/prefectures";
import { breadcrumbListLd, itemListLd, type SeoLink } from "@/lib/seo/jsonLd";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function crumbs(page: { prefecture: string; slug: string }): SeoLink[] {
  return [
    { name: "トップ", path: "/" },
    { name: "産地から選ぶ", path: "/prefectures" },
    { name: `${page.prefecture}の米`, path: `/prefectures/${page.slug}` },
  ];
}

export function generateStaticParams() {
  return PREFECTURE_PAGES.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = prefectureBySlug(slug);
  if (!page) return { title: "産地が見つかりません" };

  const title = `${page.prefecture}の米・銘柄${page.brands.length}種｜産地`;
  return {
    title,
    description: prefectureLede(page),
    alternates: { canonical: `/prefectures/${page.slug}` },
    openGraph: { title, description: prefectureLede(page), type: "article" },
    twitter: {
      card: "summary_large_image",
      title,
      description: prefectureLede(page),
    },
  };
}

export default async function PrefecturePage({ params }: PageProps) {
  const { slug } = await params;
  const page = prefectureBySlug(slug);
  if (!page) notFound();

  const trail = crumbs(page);
  const siblings = PREFECTURE_PAGES.filter(
    (row) => row.region === page.region && row.slug !== page.slug,
  );

  return (
    <main className="min-h-[100dvh] w-full min-w-0 text-[var(--km-ink)]">
      <JsonLd
        data={[
          breadcrumbListLd(trail),
          itemListLd({
            name: `${page.prefecture}の銘柄`,
            items: page.brands.map((brand) => ({
              name: brand.name,
              path: `/library/${brand.id}`,
            })),
          }),
        ]}
      />
      <SiteHeader active="library" />
      <div className={`${SITE_COLUMN} pt-5`}>
        <Breadcrumbs className={READING_COLUMN} crumbs={trail} />
      </div>
      <PrefectureView page={page} siblings={siblings} />
      <SiteFooter />
    </main>
  );
}
