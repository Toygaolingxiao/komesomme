import type { ReactNode } from "react";
import { EditorialArt } from "@/components/editorial/EditorialArt";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { PAGE_TITLE, SITE_COLUMN } from "@/components/siteChrome";
import type { SeoLink } from "@/lib/seo/jsonLd";

/**
 * Shared masthead for section index pages （料理・産地・銘柄くらべ・ライブラリ・
 * ピックアップ）. The skeleton never moves: breadcrumbs → mark → H1 → lede,
 * always at the left edge of SITE_COLUMN. The art slot (16/10) only fills on
 * pages that carry art; elsewhere an invisible spacer holds the geometry so
 * the text column starts at the same place on every page.
 */
export function PageMasthead({
  crumbs,
  mark,
  title,
  lede,
  art,
}: {
  crumbs?: SeoLink[];
  mark: ReactNode;
  title: string;
  lede: ReactNode;
  art?: { src: string; alt: string } | null;
}) {
  return (
    <>
      {crumbs ? (
        <Breadcrumbs className={`${SITE_COLUMN} pt-5`} crumbs={crumbs} />
      ) : null}
      <section className={`${SITE_COLUMN} ${crumbs ? "pt-4" : "pt-5"}`}>
        <div className="grid items-center gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,11rem)] sm:gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,13rem)]">
          <div className="min-w-0 order-2 sm:order-1">
            {mark}
            <h1 className={`mt-3 ${PAGE_TITLE}`}>{title}</h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
              {lede}
            </p>
          </div>
          {art?.src ? (
            <EditorialArt
              src={art.src}
              alt={art.alt}
              className="order-1 aspect-[16/10] w-full max-w-[13rem] sm:order-2 sm:max-w-none sm:justify-self-end"
              sizes="13rem"
              quality={86}
              priority
              objectPosition="50% 45%"
            />
          ) : (
            <div
              aria-hidden
              className="order-1 hidden aspect-[16/10] w-full max-w-[13rem] sm:order-2 sm:block sm:max-w-none sm:justify-self-end"
            />
          )}
        </div>
      </section>
    </>
  );
}
