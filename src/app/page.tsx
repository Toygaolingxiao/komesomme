import { FlavorMatrix } from "@/components/FlavorMatrix";
import { BrandLockup } from "@/components/brand/BrandMark";
import { SiteLegalNav } from "@/components/SiteFooter";
import { FOCUS } from "@/components/matrix/shared";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="km-home flex min-h-[100dvh] w-full min-w-0 flex-col overflow-x-clip text-[var(--km-ink)] lg:h-dvh lg:max-h-dvh lg:overflow-hidden">
      <header className="mx-auto flex w-full min-w-0 max-w-[1440px] shrink-0 items-center justify-between gap-2 px-4 py-2.5 sm:h-12 sm:gap-3 sm:px-5 sm:py-0">
        <Link href="/" className={`min-w-0 flex-1 ${FOCUS}`}>
          <BrandLockup subtitle="米ソムリエが選ぶ、今日の一膳" />
        </Link>
        <div className="flex max-w-[52%] shrink-0 flex-col items-end gap-0.5">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/library"
              className={`font-serif text-[11px] tracking-wide text-[var(--km-muted)] transition hover:text-[var(--km-gold)] sm:text-[12px] ${FOCUS}`}
            >
              ライブラリ
            </Link>
            <p className="hidden font-serif text-[12px] tracking-wide text-[var(--km-muted)] sm:block">
              味わいの地図
            </p>
          </div>
          <SiteLegalNav />
        </div>
      </header>

      <div id="matrix" className="min-w-0 w-full lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        <FlavorMatrix />
      </div>
    </main>
  );
}
