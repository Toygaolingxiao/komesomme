import Link from "next/link";
import { SteamMark } from "@/components/brand/EditorialMarks";
import { EditorialArt } from "@/components/editorial/EditorialArt";
import { FOCUS } from "@/components/matrix/shared";
import { SITE_COLUMN } from "@/components/siteChrome";
import type { EditorialCollection } from "@/data/editorial/collections";
import { collectionArtSrc, resolveBrandArt } from "@/lib/editorial/art";
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
        <p className="text-[12px] text-[var(--km-muted)]">
          <Link href="/collections" className={`hover:text-[var(--km-gold)] ${FOCUS}`}>
            特集
          </Link>
          <span className="mx-1.5">/</span>
          {collection.title}
        </p>

        <div className="mt-4 grid items-end gap-6 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] md:gap-10">
          {hero ? (
          <EditorialArt
            src={hero}
            alt=""
            className="aspect-[21/8] w-full md:aspect-[24/8]"
            sizes="(min-width: 768px) 55vw, 100vw"
            priority
            objectPosition="50% 42%"
          />
          ) : (
            <div
              aria-hidden
              className="aspect-[21/8] w-full bg-[var(--km-surface-warm)] md:aspect-[24/8]"
            />
          )}
          <div className="min-w-0 pb-1">
            <SteamMark className="h-7 w-7" />
            <p className="mt-3 text-[12px] text-[var(--km-muted)]">{collection.dateLabel}</p>
            <h1 className="mt-1.5 font-serif text-[1.75rem] font-semibold tracking-tight text-[var(--km-ink)] sm:text-[2rem]">
              {collection.title}
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--km-ink-soft)]">
              {collection.dek}
            </p>
          </div>
        </div>
      </div>

      <div className={`${SITE_COLUMN} mt-8 max-w-3xl space-y-3 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]`}>
        {collection.body.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>

      <ol className={`${SITE_COLUMN} mt-12 divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]`}>
        {collection.riceIds.map((id, index) => {
          const entry = byId.get(id);
          if (!entry) return null;
          const art = resolveBrandArt(entry.id, entry.region, entry.prefecture);
          const odd = index % 2 === 0;
          return (
            <li key={entry.id}>
              <Link
                href={`/library/${entry.id}`}
                className={`group grid items-center gap-4 py-5 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-5 ${FOCUS}`}
              >
                {art ? (
                  <EditorialArt
                    src={art.src}
                    alt=""
                    className={`w-full ${odd ? "aspect-[4/5]" : "aspect-square"}`}
                    sizes="6.5rem"
                    objectPosition={odd ? "40% 50%" : "60% 40%"}
                  />
                ) : (
                  <div
                    aria-hidden
                    className={`w-full bg-[var(--km-surface-warm)] ${
                      odd ? "aspect-[4/5]" : "aspect-square"
                    }`}
                  />
                )}
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
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
