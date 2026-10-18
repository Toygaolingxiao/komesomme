import type { RiceProfileV2 } from "@/types/rice";
import { joinClauses } from "@/lib/copy/joinClauses";
import {
  catalogDrinkPairings,
  catalogSeasonPairings,
  hasCatalogPairingGuide,
} from "@/lib/rice/catalogPairings";

/**
 * Season, drink, and scene pairings from the catalogue — shown on the library dossier,
 * not duplicated on the medium-detail tasting page.
 */
export function CatalogPairingGuide({ rice }: { rice: RiceProfileV2 }) {
  if (!hasCatalogPairingGuide(rice)) return null;

  const seasons = catalogSeasonPairings(rice);
  const drinks = catalogDrinkPairings(rice);
  const scenes = rice.lifestyle_scenes.filter(Boolean);

  return (
    <section className="mt-14 border-t border-[var(--km-border)] pt-10">
      <h2 className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]">
        季節と飲み物
      </h2>

      {seasons.length > 0 ? (
        <div className="mt-6">
          <p className="text-[13px] font-medium text-[var(--km-ink)]">季節</p>
          <dl className="mt-3 divide-y divide-[var(--km-border)]">
            {seasons.map(({ season, items }) => (
              <div
                key={season}
                className="flex min-w-0 flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:gap-8"
              >
                <dt className="shrink-0 text-[13px] text-[var(--km-muted)] sm:w-[5.5rem]">
                  {season}
                </dt>
                <dd className="min-w-0 text-[13px] leading-[1.75] text-[var(--km-ink-soft)]">
                  {joinClauses(items)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {drinks.length > 0 ? (
        <div className={seasons.length > 0 ? "mt-8" : "mt-6"}>
          <p className="text-[13px] font-medium text-[var(--km-ink)]">飲み物</p>
          <dl className="mt-3 divide-y divide-[var(--km-border)]">
            {drinks.map(({ label, items }) => (
              <div
                key={label}
                className="flex min-w-0 flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:gap-8"
              >
                <dt className="shrink-0 text-[13px] text-[var(--km-muted)] sm:w-[5.5rem]">
                  {label}
                </dt>
                <dd className="min-w-0 text-[13px] leading-[1.75] text-[var(--km-ink-soft)]">
                  {joinClauses(items)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {scenes.length > 0 ? (
        <p className="mt-8 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
          <span className="font-medium text-[var(--km-ink)]">こんなとき</span>
          <span className="mx-2 text-[var(--km-muted)]">/</span>
          {joinClauses(scenes)}
        </p>
      ) : null}
    </section>
  );
}
