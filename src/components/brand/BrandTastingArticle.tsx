import Link from "next/link";
import { ForYou, SimilarRiceCards } from "@/components/matrix/CompareSection";
import { PurchaseLead, PurchaseLinks } from "@/components/matrix/PurchaseLinks";
import { TasteContour } from "@/components/matrix/TasteContour";
import type { RiceMatchResult } from "@/types/rice";
import type { RiceProfileV2 } from "@/types/rice";
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

function PairingTags({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="text-[11px] tracking-[0.12em] text-[var(--km-muted)]">{label}</h2>
      <ul className="mt-3 flex flex-wrap gap-1.5">
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
        <div key={label} className="min-w-0 rounded-xl border border-[var(--km-border)] bg-[var(--km-surface)] px-3 py-3">
          <dt className="text-[10px] text-[var(--km-muted)]">{label}</dt>
          <dd className="mt-1 font-serif text-2xl leading-none text-[var(--km-brown)]">{value}</dd>
          <span aria-hidden className="mt-2 block h-1 overflow-hidden rounded-full bg-[var(--km-ink)]/8">
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

/** Medium-detail brand tasting page — pairing and taste, not the full dossier. */
export function BrandTastingArticle({
  rice,
  neighbours,
}: {
  rice: RiceProfileV2;
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
    <article className="mx-auto max-w-[920px] min-w-0 px-4 py-8 md:px-8 md:py-12">
      <nav className="text-[12px] text-[var(--km-muted)]">
        <Link href="/" className={`hover:text-[var(--km-gold)] ${FOCUS}`}>
          味わいの地図
        </Link>
        <span className="mx-1.5">/</span>
        <span>{rice.name}</span>
      </nav>

      <div
        className="mt-6 overflow-hidden rounded-[1.75rem] border border-[var(--km-border)] bg-[var(--km-surface)] shadow-[0_24px_56px_-32px_rgba(112,69,34,0.35)]"
      >
        <div className="h-1.5 w-full" style={{ background: fill }} />
        <div
          className="px-5 py-7 sm:px-8 sm:py-9"
          style={{ background: `linear-gradient(165deg, ${fill}22 0%, transparent 55%)` }}
        >
          <p className="text-[11px] tracking-[0.14em] text-[var(--km-muted)]">銘柄品鑑</p>
          <h1 className="mt-2 font-serif text-[2.15rem] font-semibold tracking-tight sm:text-[2.65rem]">
            {rice.name}
          </h1>
          <p className="mt-2 text-[13px] text-[var(--km-muted)]">
            {rice.prefecture} · {rice.region} · {rice.texture_label}／{rice.sweetness_label}
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
          <div className="mt-6">
            <PurchaseLead rice={rice} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)] lg:items-start">
        <section className="rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-5 py-6 sm:px-7">
          <ForYou rice={rice} />
        </section>

        <aside className="rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface-warm)]/50 px-5 py-5">
          <p className="text-[11px] tracking-[0.1em] text-[var(--km-muted)]">味わいの輪郭</p>
          <div className="mt-3">
            <TasteContour rice={rice} compact />
          </div>
        </aside>
      </div>

      <section className="mt-5 rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-5 py-6 sm:px-7">
        <h2 className="font-serif text-[1.1rem] font-semibold">料理との相性</h2>
        <div className="mt-5 flex flex-col gap-6">
          <PairingTags label="相性の良い料理" items={rice.best_match_dishes} />
          <PairingTags label="相性のよい食材" items={rice.good_with} />
          {rice.avoid_pairings.length > 0 ? (
            <p className="text-[13px] leading-relaxed text-[var(--km-muted)]">
              控えたい組み合わせ：{rice.avoid_pairings.join("、")}
            </p>
          ) : null}
        </div>
      </section>

      {serve || showReason || days.length > 0 ? (
        <section className="mt-5 rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-5 py-6 sm:px-7">
          <h2 className="font-serif text-[1.1rem] font-semibold">今日どう食べると美味しいか</h2>
          {serve ? (
            <p className="mt-3 font-serif text-[15px] leading-[1.85] text-[var(--km-ink)]">{serve}</p>
          ) : null}
          {showReason ? (
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--km-ink-soft)]">{pairReason}</p>
          ) : null}
          {days.length > 0 ? (
            <p className="mt-2 text-[12px] text-[var(--km-muted)]">こんな日に：{days.join("、")}</p>
          ) : null}
        </section>
      ) : null}

      {rice.sommelier_note ? (
        <blockquote className="mt-5 rounded-[1.5rem] border border-[var(--km-border)] border-l-[3px] border-l-[var(--km-gold)] bg-[var(--km-surface-warm)]/90 px-5 py-5 sm:px-7">
          <span className="block text-[11px] tracking-[0.12em] text-[var(--km-gold)]">米ソムリエメモ</span>
          <p className="mt-2 text-[14px] leading-[1.9] text-[var(--km-ink-soft)]">{rice.sommelier_note}</p>
        </blockquote>
      ) : null}

      <section className="mt-5 rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-5 py-6 sm:px-7">
        <h2 className="font-serif text-[1.1rem] font-semibold">主要な味わい</h2>
        <div className="mt-4">
          <CoreTasteGrid rice={rice} />
        </div>
        <details className="mt-5 group">
          <summary className="cursor-pointer text-[12px] text-[var(--km-muted)] marker:content-none">
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

      <section className="mt-5 rounded-[1.5rem] border border-dashed border-[var(--km-border)] bg-[var(--km-surface-warm)]/35 px-5 py-5 sm:px-7">
        <p className="text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
          季節やお酒・お茶との組み合わせ、由来、炊き方の詳しい話は
          <Link
            href={`/library/${rice.id}`}
            className={`mx-1 text-[var(--km-brown)] underline decoration-[var(--km-gold)]/50 underline-offset-2 hover:text-[var(--km-gold)] ${FOCUS}`}
          >
            銘柄ライブラリ
          </Link>
          にまとめています。
        </p>
      </section>

      {neighbours.length > 0 ? (
        <div className="mt-8">
          <SimilarRiceCards neighbours={neighbours} />
        </div>
      ) : null}

      <div className="mt-10 rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-5 py-6 sm:px-7">
        <PurchaseLinks rice={rice} />
      </div>

      <p className="mt-6 text-[11px] leading-relaxed text-[var(--km-muted)]">{DISCLAIMER}</p>
    </article>
  );
}
