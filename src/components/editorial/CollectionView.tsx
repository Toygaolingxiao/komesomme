import { TransitionLink } from "@/components/editorial/TransitionLink";
import { SteamMark } from "@/components/brand/EditorialMarks";
import { EditorialArt } from "@/components/editorial/EditorialArt";
import { FOCUS } from "@/components/matrix/shared";
import { READING_COLUMN, SITE_COLUMN } from "@/components/siteChrome";
import { collectionDateDisplay, type EditorialCollection } from "@/data/editorial/collections";
import { collectionArtSrc } from "@/lib/editorial/art";
import { splitInlineLinks } from "@/lib/editorial/inlineLinks";
import { BrandThumb } from "@/components/editorial/BrandThumb";
import { artViewTransitionName } from "@/lib/editorial/artTransition";
import type { RiceEncyclopediaManifestEntry } from "@/types/riceEncyclopedia";

export function CollectionView({
  collection,
  entries,
}: {
  collection: EditorialCollection;
  entries: RiceEncyclopediaManifestEntry[];
}) {
  const hero = collectionArtSrc(collection.artFile);
  const byId = new Map(entries.map((row) => [row.id, row]));

  return (
    <article className="pb-20">
      <div className={`${SITE_COLUMN} pt-4`}>
        <header className={READING_COLUMN}>
          <SteamMark className="h-7 w-7" />
          <p className="mt-3 text-[12px] text-[var(--km-muted)]">
            {collectionDateDisplay(collection.dateLabel)}
            {collection.updatedLabel ? (
              <span className="ml-3">{`更新 ${collectionDateDisplay(collection.updatedLabel)}`}</span>
            ) : null}
          </p>
          <h1 className="mt-1.5 font-serif text-[1.85rem] font-semibold tracking-tight text-[var(--km-ink)] sm:text-[2.1rem]">
            {collection.title}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--km-ink-soft)]">
            {collection.dek}
          </p>
        </header>
        {hero ? (
          <EditorialArt
            src={hero}
            alt=""
            className="km-figure-wide mt-6"
            sizes="(min-width: 768px) 52rem, 100vw"
            quality={90}
            priority
            objectPosition="50% 42%"
            transitionName={artViewTransitionName("collection", collection.slug)}
          />
        ) : null}
      </div>

      <div className={`${SITE_COLUMN} mt-8`}>
        <div className={`${READING_COLUMN} space-y-3 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]`}>
          {collection.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
          {collection.sections?.map((section) => (
            <section key={section.heading} className="pt-6">
              <h2 className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]">
                {section.heading}
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                {section.items.map((item) => (
                  <li key={item.slice(0, 24)}>
                    <MemoItem item={item} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <div className={SITE_COLUMN}>
      <ol className="mx-auto mt-12 max-w-[52rem] divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]">
        {collection.riceIds.map((id, index) => {
          const entry = byId.get(id);
          if (!entry) return null;
          const odd = index % 2 === 0;
          return (
            <li key={entry.id}>
              <TransitionLink
                href={`/library/${entry.id}`}
                className={`group grid grid-cols-[5.75rem_minmax(0,1fr)] items-center gap-3.5 py-4 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-5 ${FOCUS}`}
              >
                <BrandThumb
                  id={entry.id}
                  name={entry.name}
                  region={entry.region}
                  prefecture={entry.prefecture}
                  className={`w-full overflow-hidden ${odd ? "aspect-[4/5]" : "aspect-square"}`}
                  sizes="(min-width: 640px) 6.5rem, 5.75rem"
                  transitionName={artViewTransitionName("brand", entry.id)}
                />
                <span className="min-w-0">
                  <span className="text-[12px] text-[var(--km-muted)]">
                    {String(index + 1).padStart(2, "0")}
                    <span className="mx-2">{entry.prefecture}</span>
                  </span>
                  <span className="mt-1 block font-serif text-[1.3rem] font-semibold tracking-tight text-[var(--km-ink)] group-hover:text-[var(--km-brown)] sm:text-[1.4rem]">
                    {entry.name}
                  </span>
                  {entry.headline ? (
                    <span className="mt-1.5 line-clamp-2 block text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
                      {entry.headline}
                    </span>
                  ) : null}
                  {collection.riceNotes?.[entry.id] ? (
                    <span className="mt-1.5 block text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
                      {collection.riceNotes[entry.id]}
                    </span>
                  ) : null}
                </span>
              </TransitionLink>
            </li>
          );
        })}
      </ol>
      </div>
    </article>
  );
}

const MEMO_LINK_CLASS = `text-[var(--km-brown)] underline-offset-2 hover:underline ${FOCUS}`;

function MemoItem({ item }: { item: string }) {
  return splitInlineLinks(item).map((part, index) => {
    if (part.type === "text") return <span key={`${index}-${part.text}`}>{part.text}</span>;
    if (part.href.startsWith("/")) {
      return (
        <TransitionLink key={`${part.href}-${part.label}`} href={part.href} className={MEMO_LINK_CLASS}>
          {part.label}
        </TransitionLink>
      );
    }
    return (
      <a
        key={`${part.href}-${part.label}`}
        href={part.href}
        className={MEMO_LINK_CLASS}
        rel="noopener noreferrer"
        target="_blank"
      >
        {part.label}
      </a>
    );
  });
}
