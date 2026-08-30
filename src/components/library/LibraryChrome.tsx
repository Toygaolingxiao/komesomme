import Link from "next/link";
import { BrandLockup } from "@/components/brand/BrandMark";
import { SiteLegalNav } from "@/components/SiteFooter";
import { FOCUS } from "@/components/matrix/shared";

/** Shared header for /library and /library/[id] — same rhythm as the home header. */
export function LibraryChrome({ subtitle = "銘柄ライブラリ" }: { subtitle?: string }) {
  return (
    <header className="mx-auto flex w-full min-w-0 max-w-[1440px] shrink-0 items-center justify-between gap-2 px-4 py-2.5 sm:h-12 sm:gap-3 sm:px-5 sm:py-0">
      <Link href="/library" className={`min-w-0 flex-1 ${FOCUS}`}>
        <BrandLockup subtitle={subtitle} />
      </Link>
      <div className="flex max-w-[52%] shrink-0 flex-col items-end gap-0.5">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className={`font-serif text-[11px] tracking-wide text-[var(--km-muted)] transition hover:text-[var(--km-gold)] sm:text-[12px] ${FOCUS}`}
          >
            味わいの地図
          </Link>
          <p className="hidden font-serif text-[12px] tracking-wide text-[var(--km-muted)] sm:block">
            ライブラリ
          </p>
        </div>
        <SiteLegalNav />
      </div>
    </header>
  );
}
