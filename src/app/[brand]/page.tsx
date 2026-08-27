import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findRiceProfile, riceProfiles } from "@/data/riceProfilesV2";
import {
  amazonUrl,
  furusatoUrl,
  rakutenUrl,
  regionColor,
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

  const scores: Array<[string, number]> = [
    ["粒感", rice.hardness],
    ["甘み", rice.sweetness],
    ["粘り", rice.stickiness],
    ["香り", rice.aroma],
    ["旨み", rice.umami],
    ["余韻", rice.aftertaste],
    ["粒の大きさ", rice.grain_size],
    ["淡麗さ", rice.clarity],
    ["コク", rice.richness],
    ["冷めても", rice.cold_rice_quality],
    ["タレ相性", rice.sauce_absorption],
    ["油相性", rice.oil_compatibility],
  ];

  const seasons: Array<[string, string[]]> = [
    ["春", rice.spring_pairings],
    ["夏", rice.summer_pairings],
    ["秋", rice.autumn_pairings],
    ["冬", rice.winter_pairings],
  ];

  const drinks: Array<[string, string[]]> = [
    ["日本酒", rice.sake_pairings],
    ["ビール", rice.beer_pairings],
    ["ワイン", rice.wine_pairings],
    ["ウイスキー", rice.whisky_pairings],
    ["お茶", rice.tea_pairings],
  ];

  return (
    <main className="min-h-[100dvh] w-full text-[var(--km-ink)]">
      <header className="mx-auto flex h-16 max-w-[960px] items-center justify-between border-b border-[var(--km-border)] px-4 md:px-8 lg:h-[72px]">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-[var(--km-ink)] transition hover:text-[var(--km-gold)]"
        >
          KomeSomme
        </Link>
        <Link
          href="/#matrix"
          className="text-sm text-[var(--km-muted)] transition hover:text-[var(--km-gold)]"
        >
          味わいの地図へ戻る
        </Link>
      </header>

      <article className="mx-auto max-w-[960px] px-4 py-10 md:px-8 md:py-14">
        <p className="flex items-center gap-2 text-xs text-[var(--km-muted)]">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-[55%_45%_50%_50%]"
            style={{
              backgroundColor: rice.region_color ?? regionColor(rice.region),
            }}
          />
          {rice.prefecture}・{rice.region}
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tighter md:text-5xl">
          {rice.name}
        </h1>
        <p className="mt-2 text-sm text-[var(--km-ink-soft)]">
          {rice.texture_label}／{rice.sweetness_label} ・ {rice.quadrant}
        </p>

        <p className="mt-8 max-w-[52ch] text-base leading-[1.9] text-[var(--km-ink-soft)]">
          {rice.description}
        </p>

        {rice.sommelier_note ? (
          <blockquote className="mt-6 max-w-[52ch] rounded-2xl border border-[var(--km-gold)]/25 bg-[#f6ecd8]/70 px-5 py-4 text-sm leading-relaxed text-[var(--km-ink-soft)]">
            <span className="mb-2 block text-[11px] tracking-[0.12em] text-[var(--km-gold)]">
              米ソムリエメモ
            </span>
            {rice.sommelier_note}
          </blockquote>
        ) : null}

        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-[var(--km-border)] py-6 sm:grid-cols-3 md:grid-cols-4">
          {scores.map(([label, value]) => (
            <div key={label}>
              <dt className="text-[11px] text-[var(--km-muted)]">{label}</dt>
              <dd className="mt-1 font-mono text-2xl leading-none text-[var(--km-ink)]">
                {value}
              </dd>
            </div>
          ))}
        </dl>

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

          <section>
            <h2 className="text-xs tracking-[0.12em] text-[var(--km-muted)]">
              季節の相性
            </h2>
            <dl className="mt-4 divide-y divide-[var(--km-border)]">
              {seasons.map(([season, items]) =>
                items.length > 0 ? (
                  <div key={season} className="flex gap-6 py-3">
                    <dt className="w-8 shrink-0 text-sm text-[var(--km-gold)]">
                      {season}
                    </dt>
                    <dd className="text-sm leading-relaxed text-[var(--km-ink-soft)]">
                      {items.join("、")}
                    </dd>
                  </div>
                ) : null
              )}
            </dl>
          </section>

          <section>
            <h2 className="text-xs tracking-[0.12em] text-[var(--km-muted)]">
              お酒・お茶との相性
            </h2>
            <dl className="mt-4 divide-y divide-[var(--km-border)]">
              {drinks.map(([drink, items]) =>
                items.length > 0 ? (
                  <div key={drink} className="flex gap-6 py-3">
                    <dt className="w-24 shrink-0 text-sm text-[var(--km-ink)]">
                      {drink}
                    </dt>
                    <dd className="text-sm leading-relaxed text-[var(--km-ink-soft)]">
                      {items.join("、")}
                    </dd>
                  </div>
                ) : null
              )}
            </dl>
          </section>

          <TagList label="こんな気分に" items={rice.mood_pairings} />
          <TagList label="こんな場面に" items={rice.occasion_pairings} />
          <TagList label="暮らしのシーン" items={rice.lifestyle_scenes} />
        </div>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row">
          {rice.rakuten_search_keyword ? (
            <a
              href={rakutenUrl(rice.rakuten_search_keyword)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center rounded-full bg-[var(--km-gold)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--km-gold-strong)]"
            >
              楽天で探す
            </a>
          ) : null}
          {rice.amazon_search_keyword ? (
            <a
              href={amazonUrl(rice.amazon_search_keyword)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center rounded-full border border-[var(--km-border)] px-5 py-3 text-sm text-[var(--km-ink-soft)] transition hover:border-[var(--km-gold)]/45 hover:text-[var(--km-ink)]"
            >
              Amazon で探す
            </a>
          ) : null}
          {rice.furusato_keywords && rice.furusato_keywords.length > 0 ? (
            <a
              href={furusatoUrl(rice.furusato_keywords[0])}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center rounded-full border border-[var(--km-border)] px-5 py-3 text-sm text-[var(--km-ink-soft)] transition hover:border-[var(--km-gold)]/45 hover:text-[var(--km-ink)]"
            >
              ふるさと納税
            </a>
          ) : null}
        </div>

        <p className="mt-8 text-[11px] leading-relaxed text-[var(--km-muted)]">
          味わい評価は KomeSomme の編集による目安です。公的な測定値ではありません。
        </p>
      </article>
    </main>
  );
}
