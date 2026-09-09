import Link from "next/link";
import { FOCUS } from "@/components/matrix/shared";
import { SITE_COLUMN } from "@/components/siteChrome";

/**
 * Always-visible secondary destinations under the header.
 * Not a first-visit curtain — just wayfinding next to the map product.
 */
export function HomeExploreLinks() {
  return (
    <nav
      aria-label="地図のほか"
      className={`${SITE_COLUMN} flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--km-border)] py-1.5 text-[11px] text-[var(--km-muted)] sm:text-[12px]`}
    >
      <span className="text-[var(--km-muted)]/80">地図のほか</span>
      <Link
        href="/pair"
        className={`font-serif text-[var(--km-ink-soft)] transition-colors duration-150 ease-out hover:text-[var(--km-brown)] active:scale-[0.97] ${FOCUS}`}
      >
        料理で選ぶ
      </Link>
      <span aria-hidden className="text-[var(--km-border)]">
        ·
      </span>
      <Link
        href="/discover"
        className={`font-serif text-[var(--km-ink-soft)] transition-colors duration-150 ease-out hover:text-[var(--km-brown)] active:scale-[0.97] ${FOCUS}`}
      >
        ピックアップ
      </Link>
      <span aria-hidden className="text-[var(--km-border)]">
        ·
      </span>
      <Link
        href="/library"
        className={`font-serif text-[var(--km-ink-soft)] transition-colors duration-150 ease-out hover:text-[var(--km-brown)] active:scale-[0.97] ${FOCUS}`}
      >
        ライブラリ
      </Link>
    </nav>
  );
}
