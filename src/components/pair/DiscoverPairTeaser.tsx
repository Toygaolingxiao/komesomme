import Link from "next/link";
import { BowlMark, SteamMark } from "@/components/brand/EditorialMarks";
import { EditorialArt } from "@/components/editorial/EditorialArt";
import { FOCUS } from "@/components/matrix/shared";
import { SITE_COLUMN } from "@/components/siteChrome";
import { EDITORIAL_COLLECTIONS } from "@/data/editorial/collections";
import { PAIRING_PAGES } from "@/data/editorial/pairings";
import { collectionArtSrc, mastheadArtSrc, pairingArtSrc, resolveBrandArt } from "@/lib/editorial/art";
import { allResolvedPairings } from "@/lib/editorial/pairings";

/** Compact inbound list so /pair pages are not orphaned from /discover. */
export function DiscoverPairTeaser() {
  if (PAIRING_PAGES.length === 0) return null;

  const bySlug = new Map(allResolvedPairings().map((row) => [row.page.slug, row]));

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
        <Link
          href="/pair"
          className={`shrink-0 text-[12px] text-[var(--km-brown)] hover:text-[var(--km-gold)] ${FOCUS}`}
        >
          一覧へ
        </Link>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PAIRING_PAGES.map((page) => {
          let art = pairingArtSrc(page.artFile);
          if (!art && page.collectionSlug) {
            const collection = EDITORIAL_COLLECTIONS.find(
              (row) => row.slug === page.collectionSlug
            );
            art = collectionArtSrc(collection?.artFile ?? null);
          }
          if (!art) {
            const lead = bySlug.get(page.slug)?.top[0];
            art = lead
              ? resolveBrandArt(lead.id, lead.region, lead.prefecture)?.src ?? null
              : mastheadArtSrc();
          }

          return (
            <li key={page.slug}>
              <Link
                href={`/pair/${page.slug}`}
                className={`group grid grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-3 border border-[var(--km-border)] bg-[var(--km-surface)] p-2.5 sm:grid-cols-[5.5rem_minmax(0,1fr)] ${FOCUS}`}
              >
                {art ? (
                  <EditorialArt
                    src={art}
                    alt=""
                    className="aspect-[5/4] w-full"
                    sizes="5.5rem"
                    quality={72}
                    objectPosition="50% 42%"
                  />
                ) : (
                  <div
                    aria-hidden
                    className="flex aspect-[5/4] w-full items-center justify-center bg-[var(--km-surface-warm)]"
                  >
                    <BowlMark className="h-8 w-8 opacity-70" />
                  </div>
                )}
                <span className="min-w-0 pr-1">
                  <span className="font-serif text-[1.05rem] font-semibold text-[var(--km-ink)] group-hover:text-[var(--km-brown)]">
                    {page.dishLabel}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-[12px] leading-snug text-[var(--km-ink-soft)]">
                    {page.dek}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
