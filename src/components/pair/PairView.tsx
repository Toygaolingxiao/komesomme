import Link from "next/link";
import { BowlMark } from "@/components/brand/EditorialMarks";
import { EditorialArt } from "@/components/editorial/EditorialArt";
import { ComparisonTable, type ComparisonRow } from "@/components/pair/ComparisonTable";
import { FOCUS } from "@/components/matrix/shared";
import { READING_COLUMN, SITE_COLUMN } from "@/components/siteChrome";
import { EDITORIAL_COLLECTIONS } from "@/data/editorial/collections";
import { pairingPageBySlug } from "@/data/editorial/pairings";
import {
  collectionArtSrc,
  mastheadArtSrc,
  pairingArtSrc,
  resolveBrandArt,
} from "@/lib/editorial/art";
import type { ResolvedPairing } from "@/lib/editorial/pairings";
import { artViewTransitionName } from "@/lib/editorial/artTransition";
import type { RiceProfileV2 } from "@/types/rice";
import "@/components/home/sommelier-motion.css";

function suitedFor(rice: RiceProfileV2): string {
  const dishes = rice.best_match_dishes.slice(0, 2).join("、");
  return `${rice.short_} ${dishes ? `（${dishes}）` : ""}`.trim();
}

function caution(rice: RiceProfileV2): string {
  const avoid = rice.avoid_pairings[0]?.trim();
  if (avoid) return avoid;
  const reason = rice.pairing_reason.trim();
  if (!reason) return "甘みと粒感は事典で確認できます。";
  return reason.length > 48 ? `${reason.slice(0, 47)}…` : reason;
}

function heroSrc(page: ResolvedPairing["page"], lead: RiceProfileV2 | undefined): string | null {
  const dedicated = pairingArtSrc(page.artFile);
  if (dedicated) return dedicated;
  if (page.collectionSlug) {
    const collection = EDITORIAL_COLLECTIONS.find((row) => row.slug === page.collectionSlug);
    const fromCollection = collectionArtSrc(collection?.artFile ?? null);
    if (fromCollection) return fromCollection;
  }
  if (lead) {
    const brand = resolveBrandArt(lead.id, lead.region, lead.prefecture);
    if (brand) return brand.src;
  }
  return mastheadArtSrc();
}

function avoidLabel(
  rice: RiceProfileV2,
  page: ResolvedPairing["page"],
  avoidSource: ResolvedPairing["avoidSource"]
): string {
  if (avoidSource === "axis") {
    return `味の位置が遠め（${rice.sweetness_label} · ${rice.texture_label}）`;
  }
  const aliases = page.avoidAliases?.length ? page.avoidAliases : page.dishAliases;
  const hit =
    rice.avoid_pairings.find((item) => aliases.some((alias) => item.includes(alias))) ||
    rice.avoid_pairings[0];
  return hit ?? "味の位置がこの献立からは遠いです。";
}

/**
 * One left edge with the logo and breadcrumb.
 * Prose stays near 40rem. The comparison table is wider, still left-aligned.
 */
export function PairView({ resolved }: { resolved: ResolvedPairing }) {
  const { page, top, avoid, avoidSource } = resolved;
  const rows: ComparisonRow[] = top.map((rice) => ({
    rice,
    suitedFor: suitedFor(rice),
    caution: caution(rice),
  }));

  const related = page.relatedSlugs.map((slug) => pairingPageBySlug(slug)).filter(Boolean);
  const lead = top[0];
  const hero = heroSrc(page, lead);

  return (
    <article className={`${SITE_COLUMN} pair-stage-enter pb-16 text-[var(--km-ink)]`}>
      <header className={`${READING_COLUMN} pt-2`}>
        <p className="text-[12px] tracking-[0.14em] text-[var(--km-muted)]">料理で選ぶ</p>
        <h1 className="mt-2 font-serif text-[1.85rem] font-semibold leading-[1.12] tracking-tight sm:text-[2.1rem]">
          {page.dishLabel}に合う米
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--km-ink-soft)]">{page.dek}</p>
        {lead ? (
          <p className="mt-4 text-[12px] text-[var(--km-muted)]">
            いちばん近い候補は
            <Link
              href={`/library/${lead.id}`}
              className={`ml-1 text-[var(--km-brown)] hover:underline ${FOCUS}`}
            >
              {lead.name}
            </Link>
          </p>
        ) : null}
      </header>

      {hero ? (
        <EditorialArt
          src={hero}
          alt={page.dishLabel}
          className="km-figure mt-6"
          sizes="(min-width: 1024px) 40rem, 100vw"
          quality={92}
          priority
          objectPosition="48% 42%"
          transitionName={artViewTransitionName("pair", page.slug)}
        />
      ) : (
        <div className="km-figure mt-6 flex items-end bg-[var(--km-surface-warm)] px-6 pb-6">
          <BowlMark className="h-12 w-12 opacity-80" />
        </div>
      )}

      <div className={`${READING_COLUMN} mt-8 space-y-3 text-[14px] leading-[1.9] text-[var(--km-ink-soft)]`}>
        {page.lead.map((paragraph) => (
          <p key={paragraph.slice(0, 28)}>{paragraph}</p>
        ))}
      </div>

      <aside className={`${READING_COLUMN} mt-8 border-l-2 border-[var(--km-gold)]/55 pl-4`}>
        <p className="text-[11px] tracking-wide text-[var(--km-muted)]">並びの根拠</p>
        <p className="mt-1.5 text-[13px] leading-[1.85] text-[var(--km-ink-soft)]">{page.sortNote}</p>
      </aside>

      <div className="mx-auto mt-12 w-full max-w-[72rem]">
        <ComparisonTable rows={rows} title="今夜の候補" />
      </div>

      <section className={`${READING_COLUMN} mt-12`} aria-labelledby="pair-avoid-heading">
              <h2
                id="pair-avoid-heading"
                className="font-serif text-[1.2rem] font-semibold tracking-tight"
              >
                この料理には向かない米
              </h2>
              {avoidSource === "axis" && page.axisAvoidNote ? (
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--km-muted)]">
                  {page.axisAvoidNote}
                </p>
              ) : (
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--km-muted)]">
                  当サイトの評価で「向かない組み合わせ」から拾っています。
                </p>
              )}
              <ul className="mt-4 space-y-3">
                {avoid.map((rice) => (
                  <li key={rice.id} className="flex gap-3">
                    <span
                      aria-hidden
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--km-plum)]"
                    />
                    <Link href={`/library/${rice.id}`} className={`min-w-0 ${FOCUS}`}>
                      <span className="font-serif text-[1.02rem] font-semibold hover:text-[var(--km-brown)]">
                        {rice.name}
                      </span>
                      <span className="mt-0.5 block text-[13px] text-[var(--km-ink-soft)]">
                        {avoidLabel(rice, page, avoidSource)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className={`${READING_COLUMN} mt-12`} aria-labelledby="pair-faq-heading">
              <h2 id="pair-faq-heading" className="font-serif text-[1.2rem] font-semibold">
                よくある質問
              </h2>
              <dl className="mt-4 divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]">
                {page.faq.map((item) => (
                  <div key={item.q} className="py-4">
                    <dt className="text-[14px] font-medium">{item.q}</dt>
                    <dd className="mt-1.5 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
                      {item.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <nav className={`${READING_COLUMN} mt-12 border-t border-[var(--km-border)] pt-8`} aria-label="関連リンク">
              <h2 className="font-serif text-[1.1rem] font-semibold">ほかの料理</h2>
              <ul className="mt-4 grid gap-x-6 sm:grid-cols-2">
                {related.map((other) => {
                  if (!other) return null;
                  const thumb = pairingArtSrc(other.artFile);
                  return (
                    <li key={other.slug} className="border-b border-[var(--km-border)]">
                      <Link
                        href={`/pair/${other.slug}`}
                        className={`group grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-2.5 py-3 transition-colors duration-150 ease-out hover:bg-[var(--km-surface-warm)]/40 active:scale-[0.98] ${FOCUS}`}
                      >
                        {thumb ? (
                          <EditorialArt
                            src={thumb}
                            alt={other.dishLabel}
                            className="aspect-[5/4] w-full"
                            sizes="4rem"
                            quality={84}
                          />
                        ) : (
                          <div aria-hidden className="aspect-[5/4] w-full bg-[var(--km-bg-soft)]" />
                        )}
                        <span className="pr-2 font-serif text-[14px] font-semibold group-hover:text-[var(--km-brown)]">
                          {other.dishLabel}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
                <li>
                  <Link
                    href="/library"
                    className={`text-[var(--km-brown)] underline-offset-2 hover:underline active:scale-[0.97] ${FOCUS}`}
                  >
                    銘柄ライブラリ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/discover"
                    className={`text-[var(--km-brown)] underline-offset-2 hover:underline active:scale-[0.97] ${FOCUS}`}
                  >
                    ピックアップ
                  </Link>
                </li>
              </ul>
            </nav>
    </article>
  );
}
