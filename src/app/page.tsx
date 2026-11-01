import { FlavorMatrix } from "@/components/FlavorMatrix";
import { SiteHeader } from "@/components/SiteHeader";
import { HomeReadingStrip } from "@/components/home/HomeReadingStrip";
import { PAIRING_PAGES } from "@/data/editorial/pairings";
import { riceProfiles } from "@/data/rice/catalog";
import { encyclopediaManifest } from "@/data/rice/encyclopedia/load";
import { collectionsForIndex } from "@/lib/editorial/collections";
import { pickTodaysBowl } from "@/lib/editorial/todaysBowl";
import { toMapProfiles } from "@/lib/rice/mapProfile";
import { RICE_REGIONS } from "@/lib/rice/regions";

/** The reading strip's きょうの銘柄 follows the Tokyo calendar day. */
export const revalidate = 600;

export default function HomePage() {
  const entries = encyclopediaManifest();
  const knownIds = new Set(entries.map((row) => row.id));
  const collections = collectionsForIndex(knownIds).slice(0, 3);
  const bowl = pickTodaysBowl(entries);

  return (
    <main className="km-home flex min-h-[100dvh] w-full min-w-0 flex-col overflow-x-clip text-[var(--km-ink)]">
      {/* First screen: header + map, exactly as before (100dvh on desktop). */}
      <div className="flex min-h-[100dvh] flex-col lg:h-dvh lg:max-h-dvh lg:overflow-hidden">
        <SiteHeader active="map" />

        <div id="matrix" className="min-w-0 w-full lg:min-h-0 lg:flex-1 lg:overflow-hidden">
          <FlavorMatrix
            initialProfiles={toMapProfiles(riceProfiles)}
            initialRegions={[...RICE_REGIONS]}
          />
        </div>
      </div>

      {/* Crawler HTML only. Not in the visual scroll on any viewport. */}
      <HomeReadingStrip
        brandCount={riceProfiles.length}
        pairings={PAIRING_PAGES.slice(0, 6).map((row) => ({
          slug: row.slug,
          dishLabel: row.dishLabel,
        }))}
        collections={collections.map((row) => ({
          slug: row.slug,
          title: row.title,
        }))}
        bowl={bowl.map((row) => ({
          id: row.id,
          name: row.name,
          prefecture: row.prefecture,
        }))}
      />
    </main>
  );
}
