import type { RiceProfileV2 } from "@/types/rice";
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
    <section className="mt-5 rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-5 py-6 sm:px-7">
      <h2 className="font-serif text-[1.15rem] font-semibold">季節と飲み物との相性</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[var(--km-muted)]">
        編集評価に基づく目安です。好みや店の献立で変わります。
      </p>

      {seasons.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {seasons.map(({ season, items }) => (
            <div
              key={season}
              className="rounded-xl border border-[var(--km-border)] bg-[var(--km-surface-warm)]/45 px-4 py-3.5"
            >
              <p className="font-serif text-[13px] font-semibold text-[var(--km-gold)]">
                {season}
              </p>
              <p className="mt-2 text-[13px] leading-[1.75] text-[var(--km-ink-soft)]">
                {items.join("、")}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {drinks.length > 0 ? (
        <dl className="mt-6 divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]">
          {drinks.map(({ label, items }) => (
            <div key={label} className="flex min-w-0 flex-col gap-1 py-3.5 sm:flex-row sm:gap-6">
              <dt className="shrink-0 text-[13px] font-medium text-[var(--km-ink)] sm:w-20">
                {label}
              </dt>
              <dd className="min-w-0 text-[13px] leading-[1.75] text-[var(--km-ink-soft)]">
                {items.join("、")}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {scenes.length > 0 ? (
        <div className="mt-6">
          <p className="text-[11px] tracking-[0.1em] text-[var(--km-muted)]">暮らしのシーン</p>
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {scenes.map((scene) => (
              <li
                key={scene}
                className="rounded-full border border-[var(--km-border)] bg-[var(--km-surface-warm)]/70 px-3 py-1 text-[12px] text-[var(--km-brown)]"
              >
                {scene}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
