import { SteamMark } from "@/components/brand/EditorialMarks";
import { EditorialArt } from "@/components/editorial/EditorialArt";
import { TransitionLink } from "@/components/editorial/TransitionLink";
import { FOCUS } from "@/components/matrix/shared";
import { SITE_COLUMN } from "@/components/siteChrome";
import { prefectureArtPath } from "@/data/editorial/prefectureArt";
import { PREFECTURE_PAGES } from "@/lib/editorial/prefectures";
import { artViewTransitionName } from "@/lib/editorial/artTransition";

/**
 * Discover doorway to /prefectures — the largest producing prefectures as
 * art cards, mirroring the pair teaser so the two “choose by” doors read
 * as a pair. The full list (grouped by region) lives on the index itself.
 */
export function DiscoverPrefectureTeaser() {
  if (PREFECTURE_PAGES.length === 0) return null;
  const pages = [...PREFECTURE_PAGES]
    .sort((a, b) => b.brands.length - a.brands.length)
    .slice(0, 8);

  return (
    <section className={`${SITE_COLUMN} mt-12`} aria-labelledby="discover-prefecture-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SteamMark className="h-7 w-7" />
            <h2
              id="discover-prefecture-heading"
              className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]"
            >
              産地から選ぶ
            </h2>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--km-muted)]">
            県ごとの銘柄と味わいの平均像。銘柄の多い産地から並べています。
          </p>
        </div>
        <TransitionLink
          href="/prefectures"
          className={`shrink-0 text-[12px] text-[var(--km-brown)] hover:text-[var(--km-gold-ink)] ${FOCUS}`}
        >
          一覧へ
        </TransitionLink>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 md:grid-cols-4">
        {pages.map((page) => (
          <li key={page.slug}>
            <TransitionLink
              href={`/prefectures/${page.slug}`}
              className={`group block ${FOCUS}`}
            >
              <span className="relative block aspect-[5/4] overflow-hidden rounded-lg bg-[var(--km-surface-warm)]">
                <EditorialArt
                  src={prefectureArtPath(page.slug)}
                  alt={page.prefecture}
                  className="absolute inset-0 h-full w-full motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]"
                  sizes="(min-width: 768px) 220px, 45vw"
                  quality={80}
                  objectPosition="50% 42%"
                  transitionName={artViewTransitionName("prefecture", page.slug)}
                />
              </span>
              <span className="mt-2 block font-serif text-[15px] font-semibold tracking-tight text-[var(--km-ink)] group-hover:text-[var(--km-brown)]">
                {page.prefecture}
                <span className="ml-2 text-[12px] font-normal text-[var(--km-muted)]">
                  {page.brands.length}銘柄
                </span>
              </span>
            </TransitionLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
