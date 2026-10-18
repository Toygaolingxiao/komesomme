import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionsChrome } from "@/components/editorial/CollectionsChrome";
import { CollectionView } from "@/components/editorial/CollectionView";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { READING_COLUMN, SITE_COLUMN } from "@/components/siteChrome";
import { EDITORIAL_COLLECTIONS } from "@/data/editorial/collections";
import { encyclopediaManifest } from "@/data/rice/encyclopedia/load";
import { collectionBySlug, collectionPublishedIso } from "@/lib/editorial/collections";
import { articleLd, breadcrumbListLd, type SeoLink } from "@/lib/seo/jsonLd";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function crumbs(title: string, slug: string): SeoLink[] {
  return [
    { name: "トップ", path: "/" },
    { name: "ピックアップ", path: "/discover" },
    { name: title, path: `/collections/${slug}` },
  ];
}

export function generateStaticParams() {
  return EDITORIAL_COLLECTIONS.map((row) => ({ slug: row.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const knownIds = new Set(encyclopediaManifest().map((entry) => entry.id));
  const collection = collectionBySlug(slug, knownIds);
  if (!collection) return { title: "特集が見つかりません" };

  return {
    title: `${collection.title}｜特集`,
    description: collection.dek,
    alternates: { canonical: `/collections/${collection.slug}` },
    openGraph: { description: collection.dek, type: "article" },
    twitter: { description: collection.dek },
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const entries = encyclopediaManifest();
  const knownIds = new Set(entries.map((entry) => entry.id));
  const collection = collectionBySlug(slug, knownIds);
  if (!collection) notFound();

  const trail = crumbs(collection.title, collection.slug);

  return (
    <main className="min-h-[100dvh] w-full min-w-0 text-[var(--km-ink)]">
      <JsonLd
        data={[
          articleLd({
            headline: `${collection.title}｜特集`,
            description: collection.dek,
            path: `/collections/${collection.slug}`,
            imagePath: "/opengraph-image",
            datePublished: collectionPublishedIso(collection.dateLabel),
          }),
          breadcrumbListLd(trail),
        ]}
      />
      <CollectionsChrome />
      <div className={`${SITE_COLUMN} pt-5`}>
        <Breadcrumbs className={READING_COLUMN} crumbs={trail} />
      </div>
      <CollectionView collection={collection} entries={entries} />
      <SiteFooter />
    </main>
  );
}
