import type { ReactNode } from "react";
import Link from "next/link";
import { ForYou, SimilarRiceCards } from "@/components/matrix/CompareSection";
import { PurchaseLead, PurchaseLinks } from "@/components/matrix/PurchaseLinks";
import { TasteContour } from "@/components/matrix/TasteContour";
import { CatalogPairingGuide } from "@/components/library/CatalogPairingGuide";
import { SITE_COLUMN } from "@/components/siteChrome";
import {
  DISCLAIMER,
  FOCUS,
  appetiteLine,
  coreTasteMetrics,
  extraTasteMetrics,
  regionColor,
  shortTasteTags,
  technicalLine,
  todayServeLine,
} from "@/components/matrix/shared";
import type { RiceMatchResult, RiceProfileV2 } from "@/types/rice";
import type { RiceEncyclopediaArticle } from "@/types/riceEncyclopedia";

function PairingTags({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-[11px] tracking-[0.12em] text-[var(--km-muted)]">{label}</h3>
      <ul className="mt-2.5 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-full border border-[var(--km-border)] bg-[var(--km-surface-warm)]/55 px-3 py-1 text-[12px] text-[var(--km-ink-soft)]"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CoreTasteGrid({ rice }: { rice: RiceProfileV2 }) {
  const core = coreTasteMetrics(rice);
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {core.map(([label, value]) => (
        <div
          key={label}
          className="min-w-0 rounded-xl border border-[var(--km-border)] bg-[var(--km-surface)] px-3 py-3"
        >
          <dt className="text-[10px] text-[var(--km-muted)]">{label}</dt>
          <dd className="mt-1 font-serif text-2xl leading-none text-[var(--km-brown)]">
            {value}
          </dd>
          <span
            aria-hidden
            className="mt-2 block h-1 overflow-hidden rounded-full bg-[var(--km-ink)]/8"
          >
            <span
              className="block h-full rounded-full bg-[var(--km-gold)]"
              style={{ width: `${((value - 1) / 4) * 100}%` }}
            />
          </span>
        </div>
      ))}
    </dl>
  );
}

function Section({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-5 py-6 sm:px-7 ${className}`}
    >
      {title ? (
        <h2 className="font-serif text-[1.15rem] font-semibold text-[var(--km-ink)]">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}

/**
 * Single dossier for a brand: tasting (catalog) + encyclopedia in one scroll.
 * Replaces the split between /[id] and /library/[id].
 */
export function LibraryRiceDossier({
  rice,
  article,
  neighbours,
}: {
  rice: RiceProfileV2;
  article: RiceEncyclopediaArticle;
  neighbours: RiceMatchResult[];
}) {
  const fill = rice.region_color ?? regionColor(rice.region);
  const tags = shortTasteTags(rice);
  const appetite = appetiteLine(rice);
  const technical = technicalLine(rice);
  const serve = todayServeLine(rice);
  const pairReason = rice.pairing_reason.trim();
  const showReason = Boolean(pairReason) && pairReason !== appetite;
  const days = [...rice.mood_pairings, ...rice.occasion_pairings].filter(Boolean).slice(0, 2);
  const extra = extraTasteMetrics(rice);

  return (
    <article className={`${SITE_COLUMN} pb-16 pt-4`}>
      <nav className="text-[12px] text-[var(--km-muted)]">
        <Link href="/library" className={`hover:text-[var(--km-gold)] ${FOCUS}`}>
          ライブラリ
        </Link>
        <span className="mx-1.5">/</span>
        <span>{rice.name}</span>
      </nav>

      {/* Hero — catalog tasting lead + encyclopedia headline */}
      <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-[var(--km-border)] bg-[var(--km-surface)] shadow-[0_24px_56px_-32px_rgba(112,69,34,0.35)]">
        <div className="h-1.5 w-full" style={{ background: fill }} />
        <div
          className="px-5 py-7 sm:px-8 sm:py-9"
          style={{
            background: `linear-gradient(165deg, ${fill}22 0%, transparent 55%)`,
          }}
        >
          <p className="text-[11px] tracking-[0.14em] text-[var(--km-muted)]">
            {rice.prefecture} · {rice.region}
          </p>
          <h1 className="mt-2 font-serif text-[2.15rem] font-semibold tracking-tight sm:text-[2.65rem]">
            {rice.name}
          </h1>
          {article.reading ? (
            <p className="mt-1 text-[13px] text-[var(--km-muted)]">{article.reading}</p>
          ) : null}
          <p className="mt-1 text-[13px] text-[var(--km-muted)]">
            {rice.texture_label}／{rice.sweetness_label}
          </p>
          {tags.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-[var(--km-border)] bg-[var(--km-surface-warm)]/80 px-2.5 py-0.5 text-[11px] text-[var(--km-brown)]"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          <p className="mt-6 max-w-[48ch] font-serif text-[1.2rem] leading-[1.85] text-[var(--km-ink)] sm:text-[1.25rem]">
            {appetite}
          </p>
          {technical ? (
            <p className="mt-3 max-w-[48ch] text-[13px] leading-relaxed text-[var(--km-muted)]">
              {technical}
            </p>
          ) : null}
          {article.headline && article.headline !== appetite ? (
            <p className="mt-4 max-w-[52ch] text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
              {article.headline}
            </p>
          ) : null}

          <div className="mt-6">
            <PurchaseLead rice={rice} />
          </div>
        </div>
      </div>

      {/* Tasting: who it's for + contour (never squeeze text beside chart) */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2 lg:items-stretch">
        <Section className="h-full">
          <ForYou rice={rice} />
        </Section>
        <Section className="h-full">
          <TasteContour rice={rice} compact />
        </Section>
      </div>

      <Section title="料理との相性" className="mt-5">
        <div className="mt-5 flex flex-col gap-6">
          <PairingTags label="相性の良い料理" items={rice.best_match_dishes} />
          <PairingTags label="相性のよい食材" items={rice.good_with} />
          {rice.avoid_pairings.length > 0 ? (
            <p className="text-[13px] leading-relaxed text-[var(--km-muted)]">
              控えたい組み合わせ：{rice.avoid_pairings.join("、")}
            </p>
          ) : null}
        </div>
      </Section>

      {serve || showReason || days.length > 0 ? (
        <Section title="今日どう食べると美味しいか" className="mt-5">
          {serve ? (
            <p className="mt-3 font-serif text-[15px] leading-[1.85] text-[var(--km-ink)]">
              {serve}
            </p>
          ) : null}
          {showReason ? (
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
              {pairReason}
            </p>
          ) : null}
          {days.length > 0 ? (
            <p className="mt-2 text-[12px] text-[var(--km-muted)]">
              こんな日に：{days.join("、")}
            </p>
          ) : null}
        </Section>
      ) : null}

      {rice.sommelier_note ? (
        <blockquote className="mt-5 rounded-[1.5rem] border border-[var(--km-border)] border-l-[3px] border-l-[var(--km-gold)] bg-[var(--km-surface-warm)]/90 px-5 py-5 sm:px-7">
          <span className="block text-[11px] tracking-[0.12em] text-[var(--km-gold)]">
            米ソムリエメモ
          </span>
          <p className="mt-2 text-[14px] leading-[1.9] text-[var(--km-ink-soft)]">
            {rice.sommelier_note}
          </p>
        </blockquote>
      ) : null}

      <Section title="主要な味わい" className="mt-5">
        <div className="mt-4">
          <CoreTasteGrid rice={rice} />
        </div>
        <details className="mt-5">
          <summary className="cursor-pointer text-[12px] text-[var(--km-muted)]">
            詳しい味わいを見る
          </summary>
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {extra.map(([label, value]) => (
              <div key={label}>
                <dt className="text-[10px] text-[var(--km-muted)]">{label}</dt>
                <dd className="mt-0.5 font-serif text-lg leading-none text-[var(--km-ink-soft)]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      </Section>

      <p className="mt-10 mb-3 text-[11px] tracking-[0.14em] text-[var(--km-muted)]">
        もう少し詳しく
      </p>

      <Section title="由来と背景" className="mt-0">
        <p className="mt-3 text-[14px] leading-[1.9] text-[var(--km-ink-soft)]">{article.origin}</p>
      </Section>

      <Section title="主な特徴" className="mt-5">
        <ul className="mt-4 space-y-4">
          {article.features.map((feature) => (
            <li key={feature.title}>
              <h3 className="text-[13px] font-semibold text-[var(--km-brown)]">{feature.title}</h3>
              <p className="mt-1.5 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
                {feature.body}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <CatalogPairingGuide rice={rice} />

      {article.cookingTips.length > 0 ? (
        <Section title="美味しく炊くためのコツ" className="mt-5">
          <ol className="mt-4 space-y-4">
            {article.cookingTips.map((tip, index) => (
              <li key={tip.title} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--km-surface-warm)] font-serif text-[12px] text-[var(--km-brown)]">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-[13px] font-semibold text-[var(--km-ink)]">{tip.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
                    {tip.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {article.servingIdeas.length > 0 ? (
        <Section title="食卓の提案" className="mt-5">
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
        </Section>
      ) : null}

      {neighbours.length > 0 ? (
        <div className="mt-8">
          <SimilarRiceCards neighbours={neighbours} />
        </div>
      ) : null}

      <Section title="購入の目安" className="mt-8">
        <p className="mt-3 text-[14px] leading-[1.9] text-[var(--km-ink-soft)]">
          {article.purchaseNotes}
        </p>
        <div className="mt-6">
          <PurchaseLinks rice={rice} />
        </div>
      </Section>

      <aside className="mt-5 rounded-[1.25rem] border border-dashed border-[var(--km-border)] bg-[var(--km-surface-warm)]/40 px-5 py-4 text-[12px] leading-relaxed text-[var(--km-muted)]">
        <p>{article.caveats}</p>
        <p className="mt-3">{DISCLAIMER}</p>
      </aside>

      <p className="mt-6 text-center">
        <Link
          href="/"
          className={`text-[13px] text-[var(--km-muted)] transition hover:text-[var(--km-gold)] ${FOCUS}`}
        >
          味わいの地図へ戻る
        </Link>
      </p>
    </article>
  );
}
