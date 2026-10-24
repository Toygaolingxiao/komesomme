import type { Metadata } from "next";
import { DiscoverChrome } from "@/components/editorial/DiscoverChrome";
import { CollectionsIndex } from "@/components/editorial/CollectionsIndex";
import { EditorialArtPreloads } from "@/components/editorial/EditorialArtPreloads";
import { SteamMark } from "@/components/brand/EditorialMarks";
import { TodaysBowl } from "@/components/editorial/TodaysBowl";
import { DiscoverPairTeaser } from "@/components/pair/DiscoverPairTeaser";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { PAGE_TITLE, SITE_COLUMN } from "@/components/siteChrome";
import { encyclopediaManifest } from "@/data/rice/encyclopedia/load";
import { PAIRING_PAGES } from "@/data/editorial/pairings";
import { collectionArtSrc, resolveBrandArt } from "@/lib/editorial/art";
import { collectionsForIndex } from "@/lib/editorial/collections";
import { pickTodaysBowl } from "@/lib/editorial/todaysBowl";
import { itemListLd } from "@/lib/seo/jsonLd";

/** Tokyo calendar bowl + featured months. Refresh often enough to cross midnight. */
export const revalidate = 600;

const DISCOVER_DESCRIPTION =
  "きょうの三銘柄と旬の特集。日付と食卓の場面で入れ替わる、侍米師のピックアップです。";

export const metadata: Metadata = {
  title: "ピックアップ",
  description: DISCOVER_DESCRIPTION,
  alternates: { canonical: "/discover" },
  openGraph: {
    title: "ピックアップ",
    description: DISCOVER_DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ピックアップ",
    description: DISCOVER_DESCRIPTION,
  },
};

export default function DiscoverPage() {
  const entries = encyclopediaManifest();
  const knownIds = new Set(entries.map((row) => row.id));
  const bowl = pickTodaysBowl(entries);
  const collections = collectionsForIndex(knownIds);
  const preloadHrefs = [
    ...bowl
      .map((row) => resolveBrandArt(row.id, row.region, row.prefecture)?.src)
      .filter(Boolean),
    ...collections
      .slice(0, 2)
      .map((row) => collectionArtSrc(row.artFile))
      .filter(Boolean),
  ] as string[];

  return (
    <main className="min-h-[100dvh] w-full min-w-0 text-[var(--km-ink)]">
      {collections.length > 0 ? (
        <JsonLd
          data={itemListLd({
            name: "特集",
            items: collections.map((row) => ({
              name: row.title,
              path: `/collections/${row.slug}`,
            })),
          })}
        />
      ) : null}
      {PAIRING_PAGES.length > 0 ? (
        <JsonLd
          data={itemListLd({
            name: "料理で選ぶ",
            items: PAIRING_PAGES.map((row) => ({
              name: `${row.dishLabel}に合う米`,
              path: `/pair/${row.slug}`,
            })),
          })}
        />
      ) : null}
      <EditorialArtPreloads hrefs={preloadHrefs} />
      <DiscoverChrome />

      <div className="pb-16 pt-5 sm:pb-20">
        <div className={SITE_COLUMN}>
          <header className="max-w-xl">
            <SteamMark className="h-8 w-8" />
            <h1 className={`mt-3 ${PAGE_TITLE}`}>ピックアップ</h1>
            <p className="mt-3 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
              日付と旬で入れ替わる、きょうの銘柄と特集です。
            </p>
          </header>
        </div>

        <div className="mt-10">
          <TodaysBowl items={bowl} />
        </div>

        <DiscoverPairTeaser />

        <div className="mt-14 border-t border-[var(--km-border)] pt-12">
          <CollectionsIndex collections={collections} embedded />
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
