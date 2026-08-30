import type { Metadata } from "next";
import { LibraryBrowser } from "@/components/library/LibraryBrowser";
import { LibraryChrome } from "@/components/library/LibraryChrome";
import { SiteFooter } from "@/components/SiteFooter";
import { encyclopediaManifest } from "@/data/rice/encyclopedia/load";

export const metadata: Metadata = {
  title: "銘柄ライブラリ",
  description:
    "日本のブランド米の味わい・由来・炊飯のコツを一冊にまとめた KomeSomme 銘柄事典。",
};

export default function LibraryPage() {
  const entries = encyclopediaManifest();

  return (
    <main className="min-h-[100dvh] w-full min-w-0 bg-[var(--km-bg)] text-[var(--km-ink)]">
      <LibraryChrome />

      {entries.length === 0 ? (
        <div className="mx-auto max-w-[640px] px-4 py-20 text-center sm:px-5">
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
