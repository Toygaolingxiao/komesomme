import { SteamMark } from "@/components/brand/EditorialMarks";
import { EditorialArt } from "@/components/editorial/EditorialArt";
import { TransitionLink } from "@/components/editorial/TransitionLink";
import { FOCUS } from "@/components/matrix/shared";
import { SITE_COLUMN } from "@/components/siteChrome";
import { PAIRING_PAGES } from "@/data/editorial/pairings";
import { pairingArtSrc } from "@/lib/editorial/art";
import { artViewTransitionName } from "@/lib/editorial/artTransition";

/**
 * Discover teaser for cuisine landings. Compact plate thumbs — not another
 * magazine stack (collections already own the wide banners).
 */
export function DiscoverPairTeaser() {
  if (PAIRING_PAGES.length === 0) return null;

  return (
    <section className={`${SITE_COLUMN} mt-12`} aria-labelledby="discover-pair-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SteamMark className="h-7 w-7" />
            <h2
              id="discover-pair-heading"
              className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]"
            >
              料理で選ぶ
            </h2>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--km-muted)]">
            献立から、甘みと粒感の近い銘柄を並べています。
          </p>
        </div>
        <TransitionLink
          href="/pair"
          className={`shrink-0 text-[12px] text-[var(--km-brown)] hover:text-[var(--km-gold-ink)] ${FOCUS}`}
        >
          一覧へ
        </TransitionLink>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 md:grid-cols-4">
        {PAIRING_PAGES.map((page) => {
          const art = pairingArtSrc(page.artFile);
          return (
            <li key={page.slug}>
              <TransitionLink
                href={`/pair/${page.slug}`}
                className={`group block ${FOCUS}`}
              >
                <span className="relative block aspect-[5/4] overflow-hidden rounded-lg bg-[var(--km-surface-warm)]">
                  {art ? (
                    <EditorialArt
                      src={art}
                      alt=""
                      className="absolute inset-0 h-full w-full motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:scale-[1.03]"
                      sizes="(min-width: 768px) 220px, 45vw"
                      quality={80}
                      objectPosition="50% 42%"
                      transitionName={artViewTransitionName("pair", page.slug)}
                    />
                  ) : null}
                </span>
                <span className="mt-2 block font-serif text-[15px] font-semibold tracking-tight text-[var(--km-ink)] group-hover:text-[var(--km-brown)]">
                  {page.dishLabel}
                </span>
              </TransitionLink>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
