import Link from "next/link";
import { SteamMark } from "@/components/brand/EditorialMarks";
import { FOCUS } from "@/components/matrix/shared";
import { SITE_COLUMN } from "@/components/siteChrome";
import { PAIRING_PAGES } from "@/data/editorial/pairings";

/** One row of dish names. The full plates live on /pair, not again here. */
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
        <Link
          href="/pair"
          className={`shrink-0 text-[12px] text-[var(--km-brown)] hover:text-[var(--km-gold-ink)] ${FOCUS}`}
        >
          一覧へ
        </Link>
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {PAIRING_PAGES.map((page) => (
          <li key={page.slug}>
            <Link
              href={`/pair/${page.slug}`}
              className={`font-serif text-[15px] text-[var(--km-ink)] underline-offset-4 hover:text-[var(--km-brown)] hover:underline ${FOCUS}`}
            >
              {page.dishLabel}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
