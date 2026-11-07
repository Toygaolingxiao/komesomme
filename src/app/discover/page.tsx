import type { Metadata } from "next";
import { DiscoverChrome } from "@/components/editorial/DiscoverChrome";
import { CollectionsIndex } from "@/components/editorial/CollectionsIndex";
import { EditorialArtPreloads } from "@/components/editorial/EditorialArtPreloads";
import { PageMasthead } from "@/components/editorial/PageMasthead";
import { CalendarMark } from "@/components/brand/EditorialMarks";
import { TodaysBowl } from "@/components/editorial/TodaysBowl";
import { DiscoverPairTeaser } from "@/components/pair/DiscoverPairTeaser";
import { DiscoverPrefectureTeaser } from "@/components/editorial/DiscoverPrefectureTeaser";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { encyclopediaManifest } from "@/data/rice/encyclopedia/load";
import { PAIRING_PAGES } from "@/data/editorial/pairings";
import { collectionArtSrc, resolveBrandArt } from "@/lib/editorial/art";
import { collectionsForIndex } from "@/lib/editorial/collections";
import { pickTodaysBowl } from "@/lib/editorial/todaysBowl";
import { breadcrumbListLd, itemListLd } from "@/lib/seo/jsonLd";

const TRAIL = [
  { name: "トップ", path: "/" },
  { name: "ピックアップ", path: "/discover" },
];

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
      <JsonLd data={breadcrumbListLd(TRAIL)} />
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
      <PageMasthead
        crumbs={TRAIL}
        mark={<CalendarMark className="h-8 w-8" />}
        title="ピックアップ"
        lede="日付と旬で入れ替わる、きょうの銘柄と特集です。"
        art={null}
      />

      <div className="pb-16 sm:pb-20">
        <div className="mt-10">
          <TodaysBowl items={bowl} />
        </div>

        <DiscoverPairTeaser />

        <DiscoverPrefectureTeaser />

        <div className="mt-14 border-t border-[var(--km-border)] pt-12">
          <CollectionsIndex collections={collections} embedded />
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
