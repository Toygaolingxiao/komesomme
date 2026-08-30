import type { Metadata } from "next";
import Link from "next/link";
import { BrandLockup } from "@/components/brand/BrandMark";
import { LibraryBrowser } from "@/components/library/LibraryBrowser";
import { SiteFooter, SiteLegalNav } from "@/components/SiteFooter";
import { FOCUS } from "@/components/matrix/shared";
import { encyclopediaManifest } from "@/data/rice/encyclopedia/load";

export const metadata: Metadata = {
  title: "銘柄ライブラリ",
  description:
    "日本のブランド米の由来・特徴・炊飯のコツを整理した KomeSomme 銘柄事典。",
};

export default function LibraryPage() {
  const entries = encyclopediaManifest();

  return (
    <main className="min-h-[100dvh] w-full min-w-0 bg-[var(--km-bg)] text-[var(--km-ink)]">
      <header className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className={`min-w-0 ${FOCUS}`}>
          <BrandLockup subtitle="銘柄ライブラリ" />
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className={`hidden text-[12px] text-[var(--km-muted)] transition hover:text-[var(--km-gold)] sm:inline ${FOCUS}`}
          >
            味わいの地図へ
          </Link>
          <SiteLegalNav />
        </div>
      </header>

      {entries.length === 0 ? (
        <div className="mx-auto max-w-[640px] px-4 py-20 text-center">
          <h1 className="font-serif text-2xl font-semibold">銘柄ライブラリ準備中</h1>
          <p className="mt-3 text-sm text-[var(--km-muted)]">
            記事がまだ生成されていません。ローカルで{" "}
            <code className="rounded bg-[var(--km-surface)] px-1.5 py-0.5">
              npm run encyclopedia:generate
            </code>{" "}
            を実行してください。
          </p>
        </div>
      ) : (
        <LibraryBrowser entries={entries} />
      )}

      <SiteFooter />
    </main>
  );
}
