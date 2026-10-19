import { SteamMark } from "@/components/brand/EditorialMarks";
import { EditorialArt } from "@/components/editorial/EditorialArt";
import { EditorialCollectionLink } from "@/components/editorial/EditorialTrackLinks";
import { FOCUS } from "@/components/matrix/shared";
import { PAGE_TITLE, SITE_COLUMN } from "@/components/siteChrome";
import { collectionDateDisplay, type EditorialCollection } from "@/data/editorial/collections";
import { collectionArtSrc } from "@/lib/editorial/art";
import { artViewTransitionName } from "@/lib/editorial/artTransition";
import { jstMonth } from "@/lib/editorial/jst";

export function CollectionsIndex({
  collections,
  /** Nested under /discover — h2 + anchor, shorter intro. */
  embedded = false,
}: {
  collections: EditorialCollection[];
  embedded?: boolean;
}) {
  const month = jstMonth();
  const [first, ...rest] = collections;
  if (!first) return null;

  const firstCurrent = first.months.includes(month);
  const Heading = embedded ? "h2" : "h1";

  return (
    <div
      id={embedded ? "collections" : undefined}
      className={`${SITE_COLUMN} ${embedded ? "scroll-mt-16 pb-4 pt-2" : "pb-20 pt-8"}`}
    >
      <header className="max-w-2xl">
        <SteamMark className="h-8 w-8" title="特集" />
        <Heading className={`mt-3 ${PAGE_TITLE}`}>特集</Heading>
        <p className="mt-3 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
          旬や使い方で組んだ特集です。売り込みではなく、食卓の場面ごとに銘柄を並べています。
        </p>
        {embedded ? null : (
          <p className="mt-3 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
            毎月自動では増やしません。手元で読み直せる長さにしています。
          </p>
        )}
      </header>

      <div className="mt-12">
        <FeaturedRow collection={first} isCurrent={firstCurrent} />
      </div>

      {rest.length > 0 ? (
        <ul className="mt-10 divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]">
          {rest.map((collection, index) => {
            const art = collectionArtSrc(collection.artFile);
            const isCurrent = collection.months.includes(month);
            return (
              <li key={collection.slug}>
                <EditorialCollectionLink
                  href={`/collections/${collection.slug}`}
                  slug={collection.slug}
                  className={`group grid grid-cols-[6.25rem_minmax(0,1fr)] items-center gap-3.5 py-4 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-5 ${FOCUS}`}
                >
                  <RowThumb art={art} index={index} slug={collection.slug} />
                  <RowCopy collection={collection} isCurrent={isCurrent} />
                </EditorialCollectionLink>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function FeaturedRow({
  collection,
  isCurrent,
}: {
  collection: EditorialCollection;
  isCurrent: boolean;
}) {
  const art = collectionArtSrc(collection.artFile);
  return (
    <EditorialCollectionLink
      href={`/collections/${collection.slug}`}
      slug={collection.slug}
      className={`group grid max-w-[52rem] grid-cols-[6.25rem_minmax(0,1fr)] items-center gap-3.5 sm:grid-cols-[7.5rem_minmax(0,1fr)] sm:gap-5 md:block ${FOCUS}`}
    >
      {art ? (
        <EditorialArt
          src={art}
          alt=""
          className="aspect-[5/4] w-full md:mt-0 md:aspect-[2/1]"
          sizes="(min-width: 768px) 52rem, 7.5rem"
          quality={90}
          objectPosition="50% 42%"
          transitionName={artViewTransitionName("collection", collection.slug)}
        />
      ) : (
        <div
          aria-hidden
          className="aspect-[5/4] w-full bg-[var(--km-surface-warm)] md:aspect-[2/1]"
        />
      )}
      <span className="min-w-0 md:mt-4 md:block">
        <span className="flex flex-wrap items-baseline gap-x-2 text-[11px] tracking-wide text-[var(--km-muted)]">
          {isCurrent ? <span className="text-[var(--km-brown)]">今月</span> : null}
          <span>{collectionDateDisplay(collection.dateLabel)}</span>
        </span>
        <span className="mt-0.5 block font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)] group-hover:text-[var(--km-brown)] sm:text-[1.35rem] md:mt-1 md:text-[1.5rem] md:leading-tight lg:text-[1.65rem]">
          {collection.title}
        </span>
        <span className="mt-1.5 block text-[13px] leading-relaxed text-[var(--km-ink-soft)] md:mt-2 md:text-[14px]">
          {collection.dek}
        </span>
        {collection.lede ? (
          <span className="mt-2 block text-[12px] leading-relaxed text-[var(--km-muted)] md:mt-3 md:text-[13px]">
            {collection.lede}
          </span>
        ) : null}
      </span>
    </EditorialCollectionLink>
  );
}

function RowThumb({
  art,
  index,
  slug,
}: {
  art: string | null;
  index: number;
  slug: string;
}) {
  const tall = index % 2 === 0;
  if (!art) {
    return (
      <div
        aria-hidden
        className={`w-full bg-[var(--km-surface-warm)] ${tall ? "aspect-[4/5]" : "aspect-[5/4]"}`}
      />
    );
  }
  return (
    <EditorialArt
      src={art}
      alt=""
      className={`w-full ${tall ? "aspect-[4/5]" : "aspect-[5/4]"}`}
      sizes="(min-width: 640px) 7.5rem, 6.25rem"
      objectPosition={tall ? "50% 40%" : "50% 55%"}
      transitionName={artViewTransitionName("collection", slug)}
    />
  );
}

function RowCopy({
  collection,
  isCurrent,
}: {
  collection: EditorialCollection;
  isCurrent: boolean;
}) {
  return (
    <span className="min-w-0">
      <span className="flex flex-wrap items-baseline gap-x-2 text-[11px] tracking-wide text-[var(--km-muted)]">
        {isCurrent ? <span className="text-[var(--km-brown)]">今月</span> : null}
        <span>{collectionDateDisplay(collection.dateLabel)}</span>
      </span>
      <span className="mt-0.5 block font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)] group-hover:text-[var(--km-brown)] sm:text-[1.35rem]">
        {collection.title}
      </span>
      <span className="mt-1.5 block text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
        {collection.dek}
      </span>
      {collection.lede ? (
        <span className="mt-2 block text-[12px] leading-relaxed text-[var(--km-muted)]">
          {collection.lede}
        </span>
      ) : null}
    </span>
  );
}
