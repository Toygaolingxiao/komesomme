import Link from "next/link";
import { BowlMark } from "@/components/brand/EditorialMarks";
import { EditorialArt } from "@/components/editorial/EditorialArt";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { ComparisonTable, type ComparisonRow } from "@/components/pair/ComparisonTable";
import { FOCUS } from "@/components/matrix/shared";
import { EDITORIAL_COLLECTIONS } from "@/data/editorial/collections";
import { pairingPageBySlug } from "@/data/editorial/pairings";
import {
  collectionArtSrc,
  mastheadArtSrc,
  pairingArtSrc,
  resolveBrandArt,
} from "@/lib/editorial/art";
import type { ResolvedPairing } from "@/lib/editorial/pairings";
import type { RiceProfileV2 } from "@/types/rice";
import "@/components/home/sommelier-motion.css";

function suitedFor(rice: RiceProfileV2): string {
  const dishes = rice.best_match_dishes.slice(0, 2).join("、");
  return `${rice.short_} ${dishes ? `（${dishes}）` : ""}`.trim();
}

function caution(rice: RiceProfileV2): string {
  const avoid = rice.avoid_pairings[0];
  if (avoid) return `${avoid}には向きにくい、とカタログにあります。`;
  return rice.pairing_reason.slice(0, 48) || "甘みと粒感のバランスを事典で確認してください。";
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
    return `座標が遠め（${rice.sweetness_label} · ${rice.texture_label}）`;
  }
  const aliases = page.avoidAliases?.length ? page.avoidAliases : page.dishAliases;
  const hit =
    rice.avoid_pairings.find((item) => aliases.some((alias) => item.includes(alias))) ||
    rice.avoid_pairings[0];
  return `${hit}には向きにくい`;
}

/**
 * Stage magazine layout: sticky art accent on lg+ (narrow),
 * wider scrolling editorial column for the decision work.
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
    <article className="pb-16 text-[var(--km-ink)]">
      {/* Art keeps near-source ratio; sticky column fills warm paper — no full-vh object-cover stretch */}
      <div className="lg:grid lg:min-h-[calc(100dvh-3rem)] lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <aside className="relative isolate bg-[var(--km-surface-warm)] lg:sticky lg:top-0 lg:flex lg:h-[calc(100dvh-3rem)] lg:flex-col lg:min-h-0">
          <div className="relative aspect-[16/10] w-full sm:aspect-[16/9] lg:aspect-auto lg:h-[min(68dvh,34rem)] lg:max-h-[72%] lg:shrink-0">
            {hero ? (
              <EditorialArt
                src={hero}
                alt=""
                className="absolute inset-0 h-full w-full"
                sizes="(min-width: 1280px) 22rem, (min-width: 1024px) 38vw, 100vw"
                quality={92}
                priority
                objectPosition="48% 42%"
              />
            ) : (
              <div className="absolute inset-0 flex items-end bg-[var(--km-surface-warm)] px-6 pb-6">
                <BowlMark className="h-12 w-12 opacity-80" />
              </div>
            )}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-[rgba(48,40,32,0.55)] via-transparent to-[rgba(48,40,32,0.12)] lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[rgba(246,235,221,0.22)]"
            />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 lg:hidden">
              <p className="text-[12px] tracking-[0.14em] text-white/75">料理で選ぶ</p>
              <h1 className="mt-2 font-serif text-[1.85rem] font-semibold text-white sm:text-[2.1rem]">
                {page.dishLabel}に合う米
              </h1>
            </div>
          </div>
          <div aria-hidden className="hidden flex-1 bg-[var(--km-surface-warm)] lg:block" />
        </aside>

        <div className="pair-stage-enter bg-[var(--km-bg)] px-4 py-8 sm:px-5 sm:py-10 lg:px-8 lg:py-12 xl:px-10">
          <div className="mx-auto max-w-[40rem] lg:mx-0 lg:max-w-[42rem]">
            <p className="hidden text-[12px] tracking-[0.14em] text-[var(--km-muted)] lg:block">
              料理で選ぶ
            </p>
            <h1 className="mt-2 hidden font-serif text-[1.85rem] font-semibold leading-[1.12] tracking-tight sm:text-[2.1rem] lg:block">
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

            <div className="mt-8 space-y-3 text-[14px] leading-[1.9] text-[var(--km-ink-soft)]">
              {page.lead.map((paragraph) => (
                <p key={paragraph.slice(0, 28)}>{paragraph}</p>
              ))}
            </div>

            <aside className="mt-8 border-l-2 border-[var(--km-gold)]/55 pl-4">
              <p className="text-[11px] tracking-wide text-[var(--km-muted)]">並びの根拠</p>
              <p className="mt-1.5 text-[13px] leading-[1.85] text-[var(--km-ink-soft)]">
                {page.sortNote}
              </p>
            </aside>

            <section className="mt-12" aria-labelledby="pair-top-heading">
              <div className="flex items-end justify-between gap-3">
                <h2
                  id="pair-top-heading"
                  className="font-serif text-[1.3rem] font-semibold tracking-tight"
                >
                  今夜の候補
                </h2>
                <AffiliateDisclosure variant="pr" />
              </div>
              <ol className="mt-5">
                {top.map((rice, index) => {
                  const art = resolveBrandArt(rice.id, rice.region, rice.prefecture);
                  return (
                    <li
                      key={rice.id}
                      className="pair-stage-enter border-b border-[var(--km-border)]"
                      style={{ animationDelay: `${50 + index * 40}ms` }}
                    >
                      <Link
                        href={`/library/${rice.id}`}
                        className={`group grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 py-3.5 transition-transform duration-150 ease-out active:scale-[0.985] sm:grid-cols-[4rem_minmax(0,1fr)] ${FOCUS}`}
                      >
                        <span className="font-serif text-[1.35rem] tabular-nums text-[var(--km-gold)]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="flex min-w-0 items-center gap-3">
                          {art ? (
                            <EditorialArt
                              src={art.src}
                              alt=""
                              className="hidden aspect-square w-12 shrink-0 sm:block"
                              sizes="3rem"
                              quality={84}
                            />
                          ) : null}
                          <span className="min-w-0">
                            <span className="block font-serif text-[1.1rem] font-semibold group-hover:text-[var(--km-brown)]">
                              {rice.name}
                              {index === 0 ? (
                                <span className="ml-2 text-[11px] font-normal text-[var(--km-accent)]">
                                  いちばん近い
                                </span>
                              ) : null}
                            </span>
                            <span className="mt-0.5 block text-[12px] text-[var(--km-muted)]">
                              {rice.prefecture} · {rice.sweetness_label} · {rice.texture_label}
                            </span>
                            <span className="mt-1 line-clamp-2 block text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
                              {rice.short_}
                            </span>
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>

            <div className="mt-12">
              <ComparisonTable rows={rows} />
            </div>

            <section className="mt-12" aria-labelledby="pair-avoid-heading">
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
                  カタログの「向かない組み合わせ」から拾っています。
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

            <section className="mt-12" aria-labelledby="pair-faq-heading">
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

            <nav className="mt-12 border-t border-[var(--km-border)] pt-8" aria-label="関連リンク">
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
                            alt=""
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
          </div>
        </div>
      </div>
    </article>
  );
}
