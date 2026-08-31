import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { LibraryChrome } from "@/components/library/LibraryChrome";
import { LibraryRiceDossier } from "@/components/library/LibraryRiceDossier";
import { findRiceProfile, riceProfiles } from "@/data/rice/catalog";
import {
  encyclopediaManifest,
  loadEncyclopediaArticle,
} from "@/data/rice/encyclopedia/load";
import { calculateTasteNeighbours } from "@/lib/rice/matrix";

type PageProps = {
  params: Promise<{ id: string }>;
};

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
    title: `${rice.name}｜銘柄ライブラリ`,
    description,
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

  return (
    <main className="min-h-[100dvh] w-full min-w-0 text-[var(--km-ink)]">
      <LibraryChrome />
      <LibraryRiceDossier rice={rice} article={article} neighbours={neighbours} />
      <SiteFooter />
    </main>
  );
}
