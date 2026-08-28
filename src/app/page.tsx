import { FlavorMatrix } from "@/components/FlavorMatrix";
import { BrandLockup } from "@/components/brand/BrandMark";
import { SiteLegalNav } from "@/components/SiteFooter";
import { FOCUS } from "@/components/matrix/shared";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="km-home flex min-h-[100dvh] w-full min-w-0 flex-col text-[var(--km-ink)] lg:h-dvh lg:max-h-dvh lg:overflow-hidden">
      <header className="mx-auto flex h-12 w-full min-w-0 max-w-[1440px] shrink-0 items-center justify-between gap-3 px-4 sm:px-5">
        <Link href="/" className={`min-w-0 ${FOCUS}`}>
          <BrandLockup subtitle="米ソムリエが選ぶ、今日の一膳" />
        </Link>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <p className="hidden font-serif text-[12px] tracking-wide text-[var(--km-muted)] sm:block">
            味わいの地図
          </p>
          <SiteLegalNav />
        </div>
      </header>

      <div id="matrix" className="min-w-0 w-full lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        <FlavorMatrix />
      </div>
    </main>
  );
}
