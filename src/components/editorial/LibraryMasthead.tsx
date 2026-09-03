import { BowlMark } from "@/components/brand/EditorialMarks";
import { EditorialArt } from "@/components/editorial/EditorialArt";
import { SITE_COLUMN } from "@/components/siteChrome";
import { mastheadArtSrc } from "@/lib/editorial/art";

export function LibraryMasthead({ brandCount }: { brandCount: number }) {
  const art = mastheadArtSrc();

  return (
    <section className={`${SITE_COLUMN} pt-6`}>
      <div className="grid items-end gap-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-12">
        {art ? (
          <EditorialArt
            src={art}
            alt="炊きたての白飯を描いた手描き"
            className="aspect-[5/4] w-full md:aspect-[4/3]"
            sizes="(min-width: 768px) 55vw, 100vw"
            priority
          />
        ) : (
          <div
            aria-hidden
            className="aspect-[5/4] w-full bg-[var(--km-surface-warm)] md:aspect-[4/3]"
          />
        )}
        <div className="max-w-md pb-1">
          <BowlMark className="h-9 w-9" title="椀" />
          <h1 className="mt-4 font-serif text-[1.85rem] font-semibold tracking-tight text-[var(--km-ink)] sm:text-[2.15rem]">
            銘柄ライブラリ
          </h1>
          <p className="mt-4 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
            約{brandCount}銘柄の味わいと由来を並べています。
          </p>
        </div>
      </div>
    </section>
  );
}
