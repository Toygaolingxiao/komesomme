import type { ReactNode } from "react";
import Link from "next/link";
import { ForYou, SimilarRiceCards } from "@/components/matrix/CompareSection";
import { PurchaseJump, PurchaseLinks } from "@/components/matrix/PurchaseLinks";
import { TasteContour } from "@/components/matrix/TasteContour";
import { TastePips } from "@/components/matrix/TastePips";
import { ShareCardActions } from "@/components/brand/ShareCardActions";
import { EditorialArt } from "@/components/editorial/EditorialArt";
import { CatalogPairingGuide } from "@/components/library/CatalogPairingGuide";
import {
  DISCLAIMER,
  FOCUS,
  appetiteLine,
  copyEchoes,
  coreTasteMetrics,
  extraTasteMetrics,
  forYouLines,
  regionColor,
  todayServeLine,
} from "@/components/matrix/shared";
import { distinctReading, dossierExtraTags, resolveBrandArt } from "@/lib/editorial/art";
import { BrandNameMeta } from "@/components/rice/BrandNameMeta";
import type { RiceMatchResult, RiceProfileV2 } from "@/types/rice";
import type { RiceEncyclopediaArticle } from "@/types/riceEncyclopedia";

/** Reading column — narrower than SITE_COLUMN so the dossier doesn't feel like a dashboard. */
const DOSSIER_COLUMN =
  "mx-auto w-full min-w-0 max-w-[40rem] px-4 sm:px-5";

const H2 =
  "font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]";

function PairingLine({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <p className="text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
      <span className="font-medium text-[var(--km-ink)]">{label}</span>
      <span className="mx-2 text-[var(--km-muted)]">/</span>
      {items.join("、")}
    </p>
  );
}

function CoreTasteRow({ rice }: { rice: RiceProfileV2 }) {
  const core = coreTasteMetrics(rice);
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 md:grid-cols-5">
      {core.map(([label, value]) => (
        <TastePips key={label} label={label} value={value} />
      ))}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-14 border-t border-[var(--km-border)] pt-10">
      {title ? <h2 className={H2}>{title}</h2> : null}
      <div className={title ? "mt-5" : undefined}>{children}</div>
    </section>
  );
}

/**
 * Single dossier for a brand: tasting (catalog) + encyclopedia in one scroll.
 * Editorial column — few sections, hairlines, no nested surface cards.
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
  const tags = dossierExtraTags(rice);
  const appetite = appetiteLine(rice);
  const serve = todayServeLine(rice);
  const pairReason = rice.pairing_reason.trim();
  const showReason = Boolean(pairReason) && !copyEchoes(appetite, pairReason);
  const days = [...rice.mood_pairings, ...rice.occasion_pairings]
    .filter(Boolean)
    .slice(0, 2);
  const extra = extraTasteMetrics(rice);
  const forYou = forYouLines(rice);
  const heroArt = resolveBrandArt(rice.id, rice.region, rice.prefecture);
  const reading = distinctReading(rice.name, article.reading);

  return (
    <article className={`${DOSSIER_COLUMN} pb-20 pt-5`}>
      <nav className="text-[12px] text-[var(--km-muted)]">
        <Link href="/library" className={`hover:text-[var(--km-gold)] ${FOCUS}`}>
          ライブラリ
        </Link>
        <span className="mx-1.5">/</span>
        <span>{rice.name}</span>
      </nav>

      <header className="mt-6">
        {heroArt ? (
          <EditorialArt
            src={heroArt.src}
            alt=""
            className="mb-6 aspect-[16/9] w-full"
            sizes="(min-width: 640px) 40rem, 100vw"
            priority
          />
        ) : null}
        <div
          aria-hidden
          className="mb-5 h-1 w-12 rounded-full"
          style={{ background: fill }}
        />
        <p className="text-[12px] text-[var(--km-muted)]">{rice.prefecture}</p>
        <h1 className="mt-2 font-serif text-[2.25rem] font-semibold leading-[1.15] tracking-tight text-[var(--km-ink)] sm:text-[2.6rem]">
          {rice.name}
        </h1>
        <BrandNameMeta id={rice.id} reading={reading} />
        {tags.length > 0 ? (
          <p className="mt-3 text-[12px] leading-relaxed text-[var(--km-brown)]">
            {tags.join("、")}
          </p>
        ) : null}

        <p className="mt-7 max-w-[36ch] font-serif text-[1.2rem] leading-[1.85] text-[var(--km-ink)]">
          {appetite}
        </p>

        <div className="mt-7">
          <PurchaseJump label="お店で探す（ページ下部）" />
        </div>
        <ShareCardActions rice={rice} />
      </header>

      {/* 1. 味わい — who + contour + scores */}
      <Section title="味わい">
        <div className="flex flex-col gap-10">
          {forYou.length > 0 ? (
            <div>
              <p className="text-[13px] font-medium text-[var(--km-ink)]">こんな人に</p>
              <div className="mt-3">
                <ForYou rice={rice} heading={null} />
              </div>
            </div>
          ) : null}
          <TasteContour rice={rice} compact />
          <div>
            <CoreTasteRow rice={rice} />
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
          </div>
        </div>
      </Section>

      {/* 2. 食卓 — pairings + serve + ideas */}
      <Section title="合わせる食卓">
        <div className="space-y-3">
          <PairingLine label="料理" items={rice.best_match_dishes} />
          <PairingLine label="食材" items={rice.good_with} />
          {rice.avoid_pairings.length > 0 ? (
            <p className="text-[13px] leading-relaxed text-[var(--km-muted)]">
              控えたい組み合わせ：{rice.avoid_pairings.join("、")}
            </p>
          ) : null}
        </div>
        {serve || showReason || days.length > 0 ? (
          <div className="mt-6 space-y-2">
            {serve ? (
              <p className="font-serif text-[15px] leading-[1.85] text-[var(--km-ink)]">
                {serve}
              </p>
            ) : null}
            {showReason ? (
              <p className="text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
                {pairReason}
              </p>
            ) : null}
            {days.length > 0 ? (
              <p className="text-[12px] text-[var(--km-muted)]">
                こんな日に：{days.join("、")}
              </p>
            ) : null}
          </div>
        ) : null}
        {article.servingIdeas.length > 0 ? (
          <p className="mt-6 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
            <span className="font-medium text-[var(--km-ink)]">食卓の提案</span>
            <span className="mx-2 text-[var(--km-muted)]">/</span>
            {article.servingIdeas.join("、")}
          </p>
        ) : null}
        {rice.sommelier_note ? (
          <blockquote className="mt-8 border-l-2 border-[var(--km-gold)] pl-4">
            <p className="text-[12px] text-[var(--km-gold)]">侍米師メモ</p>
            <p className="mt-2 text-[14px] leading-[1.9] text-[var(--km-ink-soft)]">
              {rice.sommelier_note}
            </p>
          </blockquote>
        ) : null}
      </Section>

      {/* 3. 背景 — origin + features */}
      <Section title="由来と特徴">
        <p className="text-[14px] leading-[1.9] text-[var(--km-ink-soft)]">
          {article.origin}
        </p>
        {article.features.length > 0 ? (
          <ul className="mt-8 space-y-6">
            {article.features.map((feature) => (
              <li key={feature.title}>
                <h3 className="text-[14px] font-semibold text-[var(--km-brown)]">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
                  {feature.body}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </Section>

      {/* 4. 季節・飲み物 */}
      <CatalogPairingGuide rice={rice} />

      {/* 5. 炊き方 */}
      {article.cookingTips.length > 0 ? (
        <Section title="炊き方">
          <ul className="space-y-6">
            {article.cookingTips.map((tip) => (
              <li key={tip.title}>
                <h3 className="text-[14px] font-semibold text-[var(--km-ink)]">
                  {tip.title}
                </h3>
                <p className="mt-1.5 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
                  {tip.body}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* 6. 近い銘柄 */}
      {neighbours.length > 0 ? (
        <Section title="似ている銘柄">
          <SimilarRiceCards neighbours={neighbours} heading={null} />
        </Section>
      ) : null}

      {/* 7. 購入 — single mall strip (top is jump only) */}
      <Section title="購入の目安">
        <p className="text-[14px] leading-[1.9] text-[var(--km-ink-soft)]">
          {article.purchaseNotes}
        </p>
        <div className="mt-6">
          <PurchaseLinks rice={rice} bare />
        </div>
      </Section>

      <aside className="mt-14 space-y-3 border-t border-[var(--km-border)] pt-8 text-[12px] leading-relaxed text-[var(--km-muted)]">
        <p>{article.caveats}</p>
        <p>{DISCLAIMER}</p>
      </aside>

      <p className="mt-10 text-center">
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
