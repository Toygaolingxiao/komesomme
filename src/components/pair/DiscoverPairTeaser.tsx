import Link from "next/link";
import { SteamMark } from "@/components/brand/EditorialMarks";
import { FOCUS } from "@/components/matrix/shared";
import { SITE_COLUMN } from "@/components/siteChrome";
import { PAIRING_PAGES } from "@/data/editorial/pairings";

/** Compact inbound list so /pair pages are not orphaned from /discover. */
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
          className={`shrink-0 text-[12px] text-[var(--km-brown)] hover:text-[var(--km-gold)] ${FOCUS}`}
        >
          一覧へ
        </Link>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PAIRING_PAGES.map((page) => (
          <li key={page.slug}>
            <Link
              href={`/pair/${page.slug}`}
              className={`block border border-[var(--km-border)] bg-[var(--km-surface)] px-4 py-3 ${FOCUS}`}
            >
              <span className="font-serif text-[1.05rem] font-semibold text-[var(--km-ink)]">
                {page.dishLabel}
              </span>
              <span className="mt-1 line-clamp-2 block text-[12px] leading-snug text-[var(--km-ink-soft)]">
                {page.dek}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
