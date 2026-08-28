import type { Metadata } from "next";
import { BrandLockup } from "@/components/brand/BrandMark";
import { SiteFooter } from "@/components/SiteFooter";
import { ForYou, SimilarRiceCards } from "@/components/matrix/CompareSection";
import { DetailScrollTracker } from "@/components/matrix/DetailScrollTracker";
import { PurchaseLead, PurchaseLinks } from "@/components/matrix/PurchaseLinks";
import { TasteContour } from "@/components/matrix/TasteContour";
import { FOCUS } from "@/components/matrix/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findRiceProfile, riceProfiles } from "@/data/rice/catalog";
import { calculateTasteNeighbours } from "@/lib/rice/matrix";
import {
  DISCLAIMER,
  appetiteLine,
  coreTasteMetrics,
  drinkStyleLabels,
  extraTasteMetrics,
  regionColor,
  technicalLine,
  todayServeLine,
} from "@/components/matrix/shared";

type BrandPageProps = {
  params: Promise<{ brand: string }>;
};

export function generateStaticParams() {
  return riceProfiles.map((rice) => ({ brand: rice.id }));
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { brand } = await params;
  const rice = findRiceProfile(brand);
  if (!rice) {
    return { title: "銘柄が見つかりません | KomeSomme" };
  }

  return {
    title: `${rice.name} | KomeSomme`,
    description: rice.short_ || rice.description.slice(0, 120),
  };
}

function TagList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs tracking-[0.12em] text-[var(--km-muted)]">{label}</h2>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className="rounded-full border border-[var(--km-border)] bg-[var(--km-surface-warm)]/55 px-3 py-1 text-xs text-[var(--km-ink-soft)]"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { brand } = await params;
  const rice = findRiceProfile(decodeURIComponent(brand));
  if (!rice) notFound();

  const appetite = appetiteLine(rice);
  const technical = technicalLine(rice);
  const serve = todayServeLine(rice);
  const pairReason = rice.pairing_reason.trim();
  const showReason = Boolean(pairReason) && pairReason !== appetite;
  const days = [...rice.mood_pairings, ...rice.occasion_pairings]
    .filter(Boolean)
    .slice(0, 2);
  const neighbours = calculateTasteNeighbours(riceProfiles, rice, 3);
  const core = coreTasteMetrics(rice);
  const extra = extraTasteMetrics(rice);

  const seasons: Array<[string, string[]]> = [
    ["春", rice.spring_pairings],
    ["夏", rice.summer_pairings],
    ["秋", rice.autumn_pairings],
    ["冬", rice.winter_pairings],
  ];

  const drinks: Array<[string, string[]]> = [
    ["日本酒", drinkStyleLabels(rice.sake_pairings)],
    ["ビール", drinkStyleLabels(rice.beer_pairings)],
    ["ワイン", drinkStyleLabels(rice.wine_pairings)],
    ["ウイスキー", drinkStyleLabels(rice.whisky_pairings)],
    ["お茶", drinkStyleLabels(rice.tea_pairings)],
  ].filter(([, items]) => items.length > 0) as Array<[string, string[]]>;

  return (
    <main className="min-h-[100dvh] w-full min-w-0 overflow-x-clip text-[var(--km-ink)]">
      <DetailScrollTracker />
      <header className="mx-auto flex h-16 max-w-[960px] min-w-0 items-center justify-between gap-3 border-b border-[var(--km-border)] px-4 md:px-8 lg:h-[72px]">
        <Link href="/" className={`min-w-0 shrink ${FOCUS}`}>
          <BrandLockup />
        </Link>
        <Link
          href="/#matrix"
          className="shrink-0 text-right text-sm leading-snug text-[var(--km-muted)] transition hover:text-[var(--km-gold)]"
        >
          味わいの地図へ戻る
        </Link>
      </header>

      <article className="mx-auto max-w-[960px] min-w-0 px-4 py-10 md:px-8 md:py-14">
        <p className="flex items-center gap-2 text-xs text-[var(--km-muted)]">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor: rice.region_color ?? regionColor(rice.region),
            }}
          />
          {rice.prefecture}・{rice.region}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tighter md:text-5xl">
          {rice.name}
        </h1>
        <p className="mt-2 text-sm text-[var(--km-ink-soft)]">
          {rice.prefecture}産 ・ {rice.texture_label}／{rice.sweetness_label}
        </p>

        <p className="mt-8 max-w-[52ch] break-keep font-serif text-xl leading-[1.9] text-[var(--km-ink)]">
          {appetite}
        </p>
        {technical ? (
          <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-[var(--km-muted)]">
            {technical}
          </p>
        ) : null}

        <div className="mt-6">
          <PurchaseLead rice={rice} />
        </div>

        <div className="mt-10">
          <ForYou rice={rice} />
        </div>

        <div className="mt-10 flex flex-col gap-8">
          <TagList label="相性の良い料理" items={rice.best_match_dishes} />
          <TagList label="相性のよい食材" items={rice.good_with} />
          {rice.avoid_pairings.length > 0 ? (
            <section>
              <h2 className="text-xs tracking-[0.12em] text-[var(--km-muted)]">
                控えたい組み合わせ
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--km-ink-soft)]">
                {rice.avoid_pairings.join("、")}
              </p>
            </section>
          ) : null}
        </div>

        {serve || showReason || days.length > 0 ? (
          <section className="mt-10 max-w-[52ch]">
            <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">
              今日どう食べると美味しいか
            </h2>
            {serve ? (
              <p className="mt-3 font-serif text-base leading-[1.85] text-[var(--km-ink)]">
                {serve}
              </p>
            ) : null}
            {showReason ? (
              <p className="mt-2 text-sm leading-relaxed text-[var(--km-ink-soft)]">
                {pairReason}
              </p>
            ) : null}
            {days.length > 0 ? (
              <p className="mt-2 text-[12px] leading-relaxed text-[var(--km-muted)]">
                こんな日に：{days.join("、")}
              </p>
            ) : null}
          </section>
        ) : null}

        {rice.sommelier_note ? (
          <blockquote className="mt-10 max-w-[52ch] border-l-[3px] border-[var(--km-gold)] bg-[var(--km-surface-warm)]/90 px-5 py-4 text-sm leading-relaxed text-[var(--km-ink-soft)]">
            <span className="mb-2 block text-[11px] tracking-[0.12em] text-[var(--km-gold)]">
              米ソムリエメモ
            </span>
            {rice.sommelier_note}
          </blockquote>
        ) : null}

        <div className="mt-10">
          <TasteContour rice={rice} />
        </div>

        <section className="mt-10">
          <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">
            主要な味わい
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-[var(--km-border)] py-6 sm:grid-cols-3 md:grid-cols-5">
            {core.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-[11px] text-[var(--km-muted)]">{label}</dt>
                <dd className="mt-1 font-serif text-2xl leading-none text-[var(--km-brown)]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <details className="mt-4">
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
        </section>

        <div className="mt-10 flex flex-col gap-8">
          <section>
            <h2 className="text-xs tracking-[0.12em] text-[var(--km-muted)]">
              季節の相性
            </h2>
            <dl className="mt-4 divide-y divide-[var(--km-border)]">
              {seasons.map(([season, items]) =>
                items.length > 0 ? (
                  <div key={season} className="flex min-w-0 gap-4 py-3 sm:gap-6">
                    <dt className="w-8 shrink-0 text-sm text-[var(--km-gold)]">
                      {season}
                    </dt>
                    <dd className="min-w-0 break-words text-sm leading-relaxed text-[var(--km-ink-soft)]">
                      {items.join("、")}
                    </dd>
                  </div>
                ) : null
              )}
            </dl>
          </section>

          {drinks.length > 0 ? (
          <section>
            <h2 className="text-xs tracking-[0.12em] text-[var(--km-muted)]">
              お酒・お茶との相性
            </h2>
            <dl className="mt-4 divide-y divide-[var(--km-border)]">
              {drinks.map(([drink, items]) => (
                  <div key={drink} className="flex min-w-0 gap-3 py-3 sm:gap-6">
                    <dt className="w-16 shrink-0 text-sm text-[var(--km-ink)] sm:w-24">
                      {drink}
                    </dt>
                    <dd className="min-w-0 break-words text-sm leading-relaxed text-[var(--km-ink-soft)]">
                      {items.join("、")}
                    </dd>
                  </div>
              ))}
            </dl>
          </section>
          ) : null}

          <TagList label="暮らしのシーン" items={rice.lifestyle_scenes} />
        </div>

        {neighbours.length > 0 ? (
          <div className="mt-12">
            <SimilarRiceCards neighbours={neighbours} />
          </div>
        ) : null}

        <div className="mt-12">
          <PurchaseLinks rice={rice} />
        </div>

        <p className="mt-8 text-[11px] leading-relaxed text-[var(--km-muted)]">
          {DISCLAIMER}
        </p>
      </article>
      <SiteFooter />
    </main>
  );
}
