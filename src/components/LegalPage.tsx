import type { ReactNode } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { PAGE_TITLE, READING_COLUMN, SITE_COLUMN } from "@/components/siteChrome";
import { FOCUS } from "@/components/matrix/shared";

export function LegalShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-[100dvh] w-full min-w-0 overflow-x-clip text-[var(--km-ink)]">
      <SiteHeader />
      <article className={`${SITE_COLUMN} pb-10 pt-8 sm:pb-14 sm:pt-10`}>
        <div className={READING_COLUMN}>
        <Link
          href="/"
          className={`text-[12px] text-[var(--km-muted)] transition hover:text-[var(--km-gold)] ${FOCUS}`}
        >
          味わいの地図へ戻る
        </Link>
        <h1 className={`mt-4 ${PAGE_TITLE}`}>{title}</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--km-ink-soft)]">
          {children}
        </div>
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
