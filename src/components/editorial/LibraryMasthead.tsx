import { BowlMark } from "@/components/brand/EditorialMarks";
import { EditorialArt } from "@/components/editorial/EditorialArt";
import { SITE_COLUMN } from "@/components/siteChrome";
import { mastheadArtSrc } from "@/lib/editorial/art";

/** Compact masthead — art is an accent, not half the first viewport. */
export function LibraryMasthead({ brandCount }: { brandCount: number }) {
  const art = mastheadArtSrc();

  return (
    <section className={`${SITE_COLUMN} pt-5`}>
      <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,11rem)] sm:gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,13rem)]">
        <div className="min-w-0 order-2 sm:order-1">
          <BowlMark className="h-8 w-8" title="椀" />
          <h1 className="mt-3 font-serif text-[1.75rem] font-semibold tracking-tight text-[var(--km-ink)] sm:text-[2rem]">
            銘柄ライブラリ
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
            約{brandCount}銘柄の味わいと由来を並べています。
          </p>
        </div>
        {art ? (
          <EditorialArt
            src={art}
            alt="炊きたての白飯を描いた手描き"
            className="order-1 aspect-[16/10] w-full max-w-[13rem] sm:order-2 sm:max-w-none sm:justify-self-end"
            sizes="13rem"
            quality={86}
            priority
            objectPosition="50% 45%"
          />
        ) : (
          <div
            aria-hidden
            className="order-1 aspect-[16/10] w-full max-w-[13rem] bg-[var(--km-surface-warm)] sm:order-2 sm:max-w-none sm:justify-self-end"
          />
        )}
      </div>
    </section>
  );
}
