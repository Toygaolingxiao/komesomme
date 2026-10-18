import Link from "next/link";
import { SteamMark } from "@/components/brand/EditorialMarks";
import { EditorialArt } from "@/components/editorial/EditorialArt";
import { EditorialCollectionLink } from "@/components/editorial/EditorialTrackLinks";
import { FOCUS } from "@/components/matrix/shared";
import { SITE_COLUMN } from "@/components/siteChrome";
import type { EditorialCollection } from "@/data/editorial/collections";
import { collectionArtSrc } from "@/lib/editorial/art";
import { artViewTransitionName } from "@/lib/editorial/artTransition";

/** Wide short banners — news-feed density, not magazine hero stacks. */
export function DiscoverCollectionTeaser({
  collections,
}: {
  collections: EditorialCollection[];
}) {
  if (collections.length === 0) return null;

  return (
    <section className={`${SITE_COLUMN} mt-12`} aria-labelledby="discover-collections-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SteamMark className="h-7 w-7" />
            <h2
              id="discover-collections-heading"
              className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]"
            >
              旬の特集
            </h2>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--km-muted)]">
            今月のピックアップ。
          </p>
        </div>
        <Link
          href="/discover#collections"
          className={`shrink-0 text-[12px] text-[var(--km-brown)] hover:text-[var(--km-gold)] ${FOCUS}`}
        >
          一覧へ
        </Link>
      </div>

      <ul className="mt-5 space-y-4">
        {collections.map((collection) => {
          const art = collectionArtSrc(collection.artFile);
          return (
            <li key={collection.slug}>
              <EditorialCollectionLink
                href={`/collections/${collection.slug}`}
                slug={collection.slug}
                className={`group block overflow-hidden rounded-lg border border-[var(--km-border)] bg-[var(--km-surface)] ${FOCUS}`}
              >
                <span className="relative block aspect-[16/9] w-full">
                  {art ? (
                    <EditorialArt
                      src={art}
                      alt=""
                      className="absolute inset-0 h-full w-full"
                      sizes="(min-width: 768px) 900px, 100vw"
                      quality={90}
                      objectPosition="50% 42%"
                      transitionName={artViewTransitionName("collection", collection.slug)}
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="absolute inset-0 block bg-[var(--km-surface-warm)]"
                    />
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-[rgba(48,40,32,0.55)] via-[rgba(48,40,32,0.12)] to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                    <span className="text-[11px] tracking-wide text-white/85">
                      {collection.dateLabel}
                    </span>
                    <span className="mt-0.5 block font-serif text-[1.15rem] font-semibold tracking-tight text-white sm:text-[1.3rem]">
                      {collection.title}
                    </span>
                    <span className="mt-1 line-clamp-1 block text-[12px] leading-snug text-white/90 sm:text-[13px]">
                      {collection.dek}
                    </span>
                  </span>
                </span>
              </EditorialCollectionLink>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
