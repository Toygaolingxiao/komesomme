import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { LibraryChrome } from "@/components/library/LibraryChrome";
import { LibraryRiceDossier } from "@/components/library/LibraryRiceDossier";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { findRiceProfile, riceProfiles } from "@/data/rice/catalog";
import {
  encyclopediaManifest,
  loadEncyclopediaArticle,
} from "@/data/rice/encyclopedia/load";
import { calculateTasteNeighbours } from "@/lib/rice/matrix";
import { articleLd, breadcrumbListLd, type SeoLink } from "@/lib/seo/jsonLd";

type PageProps = {
  params: Promise<{ id: string }>;
};

/** Shared by generateMetadata, the JSON-LD headline, and the trail. */
function pageTitle(name: string): string {
  return `${name}｜銘柄ライブラリ`;
}

function crumbs(name: string, id: string): SeoLink[] {
  return [
    { name: "トップ", path: "/" },
    { name: "銘柄ライブラリ", path: "/library" },
    { name, path: `/library/${id}` },
  ];
}

export function generateStaticParams() {
  const fromManifest = encyclopediaManifest().map((entry) => ({ id: entry.id }));
  if (fromManifest.length > 0) return fromManifest;
  return riceProfiles.map((rice) => ({ id: rice.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = loadEncyclopediaArticle(id);
  const rice = findRiceProfile(id);
  if (!article || !rice) return { title: "銘柄が見つかりません" };

  const description = article.headline || rice.short_ || rice.description;
  const title = `${rice.prefecture} ${rice.name}`;

  return {
    title: pageTitle(rice.name),
    description,
    alternates: { canonical: `/library/${rice.id}` },
    openGraph: {
      title,
      description,
      locale: "ja_JP",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LibraryArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = loadEncyclopediaArticle(id);
  const rice = findRiceProfile(id);
  if (!article || !rice) notFound();

  const neighbours = calculateTasteNeighbours(riceProfiles, rice, 3);
  const trail = crumbs(rice.name, rice.id);

  return (
    <main className="min-h-[100dvh] w-full min-w-0 text-[var(--km-ink)]">
      <JsonLd
        data={[
          articleLd({
            headline: pageTitle(rice.name),
            description: article.headline || rice.short_ || rice.description,
            path: `/library/${rice.id}`,
            imagePath: `/library/${rice.id}/opengraph-image`,
            datePublished: article.generatedAt,
          }),
          breadcrumbListLd(trail),
        ]}
      />
      <LibraryChrome />
      <Breadcrumbs
        className="mx-auto w-full min-w-0 max-w-[40rem] px-4 pt-5 sm:px-5"
        crumbs={trail}
      />
      <LibraryRiceDossier rice={rice} article={article} neighbours={neighbours} />
      <SiteFooter />
    </main>
  );
}
