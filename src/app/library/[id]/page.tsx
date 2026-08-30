import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandLockup } from "@/components/brand/BrandMark";
import { PurchaseLinks } from "@/components/matrix/PurchaseLinks";
import { SiteFooter, SiteLegalNav } from "@/components/SiteFooter";
import { FOCUS, regionColor } from "@/components/matrix/shared";
import { CatalogPairingGuide } from "@/components/library/CatalogPairingGuide";
import { CatalogTastingStrip } from "@/components/library/CatalogTastingStrip";
import { findRiceProfile, riceProfiles } from "@/data/rice/catalog";
import {
  encyclopediaManifest,
  loadEncyclopediaArticle,
} from "@/data/rice/encyclopedia/load";

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  const fromManifest = encyclopediaManifest().map((entry) => ({ id: entry.id }));
  if (fromManifest.length > 0) return fromManifest;
  return riceProfiles.map((rice) => ({ id: rice.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = loadEncyclopediaArticle(id);
  const rice = findRiceProfile(id);
  if (!article || !rice) return { title: "銘柄が見つかりません" };
  return {
    title: `${rice.name}｜銘柄ライブラリ`,
    description: article.headline,
  };
}

export default async function LibraryArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = loadEncyclopediaArticle(id);
  const rice = findRiceProfile(id);
  if (!article || !rice) notFound();

  const fill = rice.region_color ?? regionColor(rice.region);

  return (
    <main className="min-h-[100dvh] w-full min-w-0 bg-[var(--km-bg)] text-[var(--km-ink)]">
      <header className="mx-auto flex w-full max-w-[820px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/library" className={`min-w-0 ${FOCUS}`}>
          <BrandLockup subtitle="銘柄ライブラリ" />
        </Link>
        <SiteLegalNav />
      </header>

      <article className="mx-auto w-full max-w-[820px] px-4 pb-16 pt-4 sm:px-6">
        <nav className="text-[12px] text-[var(--km-muted)]">
          <Link href="/library" className={`hover:text-[var(--km-gold)] ${FOCUS}`}>
            ライブラリ
          </Link>
          <span className="mx-1.5">/</span>
          <span>{rice.name}</span>
        </nav>

        <div
          className="mt-5 overflow-hidden rounded-[1.75rem] border border-[var(--km-border)] bg-[var(--km-surface)] shadow-[0_28px_64px_-36px_rgba(112,69,34,0.4)]"
        >
          <div className="h-1.5 w-full" style={{ background: fill }} />
          <div className="px-5 py-6 sm:px-8 sm:py-8">
            <p className="text-[11px] tracking-[0.14em] text-[var(--km-muted)]">
              {rice.prefecture} · {rice.region}
            </p>
            <h1 className="mt-2 font-serif text-[2rem] font-semibold tracking-tight sm:text-[2.35rem]">
              {rice.name}
            </h1>
            {article.reading ? (
              <p className="mt-1 text-[13px] text-[var(--km-muted)]">{article.reading}</p>
            ) : null}
            <p className="mt-5 text-[15px] leading-[1.85] text-[var(--km-ink)]">
              {article.headline}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={`/${rice.id}`}
                className={`rounded-full border border-[var(--km-border)] bg-[var(--km-surface-warm)] px-3.5 py-2 text-[12px] text-[var(--km-brown)] ${FOCUS}`}
              >
                品鑑ページを見る
              </Link>
              <Link
                href="/"
                className={`rounded-full border border-[var(--km-border)] px-3.5 py-2 text-[12px] text-[var(--km-muted)] ${FOCUS}`}
              >
                味わいの地図へ
              </Link>
            </div>
          </div>
        </div>

        <CatalogTastingStrip rice={rice} />

        <section className="mt-8 rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-5 py-6 sm:px-7">
          <h2 className="font-serif text-[1.15rem] font-semibold">由来と背景</h2>
          <p className="mt-3 text-[14px] leading-[1.9] text-[var(--km-ink-soft)]">
            {article.origin}
          </p>
        </section>

        <section className="mt-5 rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-5 py-6 sm:px-7">
          <h2 className="font-serif text-[1.15rem] font-semibold">主な特徴</h2>
          <ul className="mt-4 space-y-4">
            {article.features.map((feature) => (
              <li key={feature.title}>
                <h3 className="text-[13px] font-semibold text-[var(--km-brown)]">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
                  {feature.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <CatalogPairingGuide rice={rice} />

        {article.cookingTips.length > 0 ? (
          <section className="mt-5 rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-5 py-6 sm:px-7">
            <h2 className="font-serif text-[1.15rem] font-semibold">
              美味しく炊くためのコツ
            </h2>
            <ol className="mt-4 space-y-4">
              {article.cookingTips.map((tip, index) => (
                <li key={tip.title} className="flex gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--km-surface-warm)] font-serif text-[12px] text-[var(--km-brown)]">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-[13px] font-semibold text-[var(--km-ink)]">
                      {tip.title}
                    </h3>
                    <p className="mt-1.5 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
                      {tip.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {article.servingIdeas.length > 0 ? (
          <section className="mt-5 rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-5 py-6 sm:px-7">
            <h2 className="font-serif text-[1.15rem] font-semibold">食卓の提案</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {article.servingIdeas.map((idea) => (
                <li
                  key={idea}
                  className="rounded-full border border-[var(--km-border)] bg-[var(--km-surface-warm)]/70 px-3 py-1.5 text-[12px] text-[var(--km-brown)]"
                >
                  {idea}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-5 rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-5 py-6 sm:px-7">
          <h2 className="font-serif text-[1.15rem] font-semibold">購入の目安</h2>
          <p className="mt-3 text-[14px] leading-[1.9] text-[var(--km-ink-soft)]">
            {article.purchaseNotes}
          </p>
          <div className="mt-6">
            <PurchaseLinks rice={rice} />
          </div>
        </section>

        <aside className="mt-5 rounded-[1.25rem] border border-dashed border-[var(--km-border)] bg-[var(--km-surface-warm)]/40 px-5 py-4 text-[12px] leading-relaxed text-[var(--km-muted)]">
          <p>{article.caveats}</p>
          <p className="mt-2">
            生成モデル: {article.model} · 信頼度目安: {article.confidence} ·{" "}
            {new Date(article.generatedAt).toLocaleDateString("ja-JP")}
          </p>
        </aside>
      </article>

      <SiteFooter />
    </main>
  );
}
