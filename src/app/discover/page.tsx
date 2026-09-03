import type { Metadata } from "next";
import { DiscoverChrome } from "@/components/editorial/DiscoverChrome";
import { DiscoverCollectionTeaser } from "@/components/editorial/DiscoverCollectionTeaser";
import { EditorialArtPreloads } from "@/components/editorial/EditorialArtPreloads";
import { SteamMark } from "@/components/brand/EditorialMarks";
import { TodaysBowl } from "@/components/editorial/TodaysBowl";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_COLUMN } from "@/components/siteChrome";
import { encyclopediaManifest } from "@/data/rice/encyclopedia/load";
import { collectionArtSrc, resolveBrandArt } from "@/lib/editorial/art";
import { featuredCollections } from "@/lib/editorial/collections";
import { pickTodaysBowl } from "@/lib/editorial/todaysBowl";

export const metadata: Metadata = {
  title: "ピックアップ",
  description:
    "きょうの三銘柄と今月の特集。日付と旬で入れ替わる、米ソムリエのピックアップです。",
  alternates: { canonical: "/discover" },
};

export default function DiscoverPage() {
  const entries = encyclopediaManifest();
  const knownIds = new Set(entries.map((row) => row.id));
  const bowl = pickTodaysBowl(entries);
  const collections = featuredCollections(knownIds);
  const preloadHrefs = [
    ...bowl
      .map((row) => resolveBrandArt(row.id, row.region, row.prefecture)?.src)
      .filter(Boolean),
    ...collections.map((row) => collectionArtSrc(row.artFile)).filter(Boolean),
  ] as string[];

  return (
    <main className="min-h-[100dvh] w-full min-w-0 text-[var(--km-ink)]">
      <EditorialArtPreloads hrefs={preloadHrefs} />
      <DiscoverChrome />

      <div className="pb-16 pt-8 sm:pb-20 sm:pt-10">
        <div className={SITE_COLUMN}>
          <header className="max-w-xl">
            <SteamMark className="h-8 w-8" />
            <h1 className="mt-4 font-serif text-[1.85rem] font-semibold tracking-tight text-[var(--km-ink)] sm:text-[2.15rem]">
              ピックアップ
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--km-ink-soft)]">
              日付と旬で入れ替わる、きょうの銘柄と特集です。
            </p>
          </header>
        </div>

        <div className="mt-10">
          <TodaysBowl items={bowl} />
        </div>

        <DiscoverCollectionTeaser collections={collections} />
      </div>

      <SiteFooter />
    </main>
  );
}
