import Link from "next/link";
import { FlavorMatrix } from "@/components/FlavorMatrix";
import { SiteHeader } from "@/components/SiteHeader";
import { HomeReadingStrip } from "@/components/home/HomeReadingStrip";
import { FOCUS } from "@/components/matrix/shared";
import { SITE_COLUMN } from "@/components/siteChrome";
import { PAIRING_PAGES } from "@/data/editorial/pairings";
import { riceProfiles } from "@/data/rice/catalog";
import { encyclopediaManifest } from "@/data/rice/encyclopedia/load";
import { collectionsForIndex } from "@/lib/editorial/collections";
import { pickTodaysBowl } from "@/lib/editorial/todaysBowl";
import { isDiagnosisEnabled } from "@/lib/diagnosis/enabled";
import { DIAGNOSIS_COPY } from "@/lib/diagnosis/questions";
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

      {/* One quiet text entry to the diagnosis, below the map. Not in the
          top navigation (the six-item cap stands). */}
      {isDiagnosisEnabled() ? (
        <section aria-label={DIAGNOSIS_COPY.entryLead} className={`${SITE_COLUMN} py-12`}>
          <div className="mx-auto max-w-[40rem] border-t border-[var(--km-border)] pt-8 text-center">
            <p className="font-serif text-[1.15rem] font-semibold tracking-tight text-[var(--km-ink)]">
              {DIAGNOSIS_COPY.entryLead}
            </p>
            <p className="mt-2 text-[13.5px] leading-[1.85] text-[var(--km-muted)]">
              {DIAGNOSIS_COPY.entryNote}
            </p>
            <Link
              href="/shindan"
              className={`mt-3 inline-block text-[14px] font-medium text-[var(--km-brown)] underline-offset-4 hover:underline ${FOCUS}`}
            >
              {DIAGNOSIS_COPY.startButton} →
            </Link>
          </div>
        </section>
      ) : null}

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
