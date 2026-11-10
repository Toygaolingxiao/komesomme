import Link from "next/link";
import { FlavorMatrix } from "@/components/FlavorMatrix";
import { EditorialArt } from "@/components/editorial/EditorialArt";
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

      {/* Diagnosis entry below the map (v1.33.0): a card in the same
          language as the collection teasers — hero thumbnail, serif
          title, one-line note — instead of the former lone text link. */}
      {isDiagnosisEnabled() ? (
        <section aria-label={DIAGNOSIS_COPY.entryLead} className={`${SITE_COLUMN} py-12`}>
          <div className="border-t border-[var(--km-border)] pt-8">
            <Link
              href="/shindan"
              className={`group block overflow-hidden rounded-lg border border-[var(--km-border)] bg-[var(--km-surface)] ${FOCUS}`}
            >
              <span className="flex flex-col sm:flex-row">
                <span className="relative block aspect-[16/9] w-full flex-none sm:aspect-auto sm:min-h-[10.5rem] sm:w-[38%]">
                  <EditorialArt
                    src="/brand-art/shindan-hero.webp"
                    alt=""
                    className="absolute inset-0 h-full w-full"
                    sizes="(min-width: 640px) 34rem, 100vw"
                    objectPosition="50% 82%"
                  />
                </span>
                <span className="flex flex-1 flex-col justify-center p-5 sm:p-6">
                  <span className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]">
                    {DIAGNOSIS_COPY.entryLead}
                  </span>
                  <span className="mt-1.5 text-[13.5px] leading-[1.85] text-[var(--km-muted)]">
                    {DIAGNOSIS_COPY.entryNote}
                  </span>
                  <span className="mt-3 text-[14px] font-medium text-[var(--km-brown)] underline-offset-4 group-hover:underline">
                    {DIAGNOSIS_COPY.startButton} →
                  </span>
                </span>
              </span>
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
