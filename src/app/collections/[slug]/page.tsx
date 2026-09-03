import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionsChrome } from "@/components/editorial/CollectionsChrome";
import { CollectionView } from "@/components/editorial/CollectionView";
import { SiteFooter } from "@/components/SiteFooter";
import { EDITORIAL_COLLECTIONS } from "@/data/editorial/collections";
import { encyclopediaManifest } from "@/data/rice/encyclopedia/load";
import { collectionBySlug } from "@/lib/editorial/collections";

type PageProps = {
  params: Promise<{ slug: string }>;
};

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
    openGraph: { description: collection.dek },
    twitter: { description: collection.dek },
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { slug } = await params;
  const entries = encyclopediaManifest();
  const knownIds = new Set(entries.map((entry) => entry.id));
  const collection = collectionBySlug(slug, knownIds);
  if (!collection) notFound();

  return (
    <main className="min-h-[100dvh] w-full min-w-0 text-[var(--km-ink)]">
      <CollectionsChrome />
      <CollectionView collection={collection} entries={entries} />
      <SiteFooter />
    </main>
  );
}
