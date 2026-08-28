import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLockup } from "@/components/brand/BrandMark";
import { SiteFooter } from "@/components/SiteFooter";
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
      <header className="mx-auto flex h-16 max-w-[960px] min-w-0 items-center justify-between gap-3 border-b border-[var(--km-border)] px-4 md:px-8">
        <Link href="/" className={`min-w-0 ${FOCUS}`}>
          <BrandLockup />
        </Link>
        <Link
          href="/"
          className="shrink-0 text-sm text-[var(--km-muted)] transition hover:text-[var(--km-gold)]"
        >
          味わいの地図へ戻る
        </Link>
      </header>
      <article className="mx-auto max-w-[720px] min-w-0 px-4 py-10 md:px-8 md:py-14">
        <h1 className="font-serif text-3xl font-semibold tracking-tight">{title}</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[var(--km-ink-soft)]">
          {children}
        </div>
      </article>
      <SiteFooter />
    </main>
  );
}
