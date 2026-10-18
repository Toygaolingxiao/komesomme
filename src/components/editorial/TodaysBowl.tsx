import { CalendarMark } from "@/components/brand/EditorialMarks";
import { BrandThumb } from "@/components/editorial/BrandThumb";
import { EditorialBowlLink } from "@/components/editorial/EditorialTrackLinks";
import { FOCUS } from "@/components/matrix/shared";
import { SITE_COLUMN } from "@/components/siteChrome";
import { artViewTransitionName } from "@/lib/editorial/artTransition";
import type { RiceEncyclopediaManifestEntry } from "@/types/riceEncyclopedia";

/** News-style rows for /discover — thumb + name + one-line headline. */
export function TodaysBowl({ items }: { items: RiceEncyclopediaManifestEntry[] }) {
  if (items.length === 0) return null;

  return (
    <section className={`${SITE_COLUMN}`} aria-labelledby="todays-bowl-heading">
      <div className="flex items-center gap-2">
        <CalendarMark className="h-7 w-7" />
        <h2
          id="todays-bowl-heading"
          className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]"
        >
          きょうの三銘柄
        </h2>
      </div>
      <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[var(--km-muted)]">
        日付で入れ替わる三銘柄。
      </p>

      <ul className="mt-5 divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]">
        {items.map((entry) => (
          <li key={entry.id}>
            <BowlNewsRow entry={entry} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function BowlNewsRow({ entry }: { entry: RiceEncyclopediaManifestEntry }) {
  const blurb = entry.headline.trim();

  return (
    <EditorialBowlLink
      href={`/library/${entry.id}`}
      riceId={entry.id}
      className={`group grid grid-cols-[5.75rem_minmax(0,1fr)] items-center gap-3.5 py-3.5 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-5 ${FOCUS}`}
    >
      <BrandThumb
        id={entry.id}
        name={entry.name}
        region={entry.region}
        prefecture={entry.prefecture}
        className="aspect-[4/3] w-full overflow-hidden"
        sizes="7rem"
        transitionName={artViewTransitionName("brand", entry.id)}
      />
      <span className="min-w-0">
        <span className="text-[12px] text-[var(--km-muted)]">{entry.prefecture}</span>
        <span className="mt-0.5 block font-serif text-[1.15rem] font-semibold tracking-tight text-[var(--km-ink)] group-hover:text-[var(--km-brown)] sm:text-[1.25rem]">
          {entry.name}
        </span>
        {blurb ? (
          <span className="mt-1 line-clamp-2 block text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
            {blurb}
          </span>
        ) : null}
      </span>
    </EditorialBowlLink>
  );
}
