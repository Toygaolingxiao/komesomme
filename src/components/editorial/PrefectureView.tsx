import Link from "next/link";
import { TransitionLink } from "@/components/editorial/TransitionLink";
import { EditorialArt } from "@/components/editorial/EditorialArt";
import { BrandThumb } from "@/components/editorial/BrandThumb";
import { FOCUS } from "@/components/matrix/shared";
import { READING_COLUMN, SITE_COLUMN } from "@/components/siteChrome";
import { prefectureArtPath } from "@/data/editorial/prefectureArt";
import {
  prefectureAreaWord,
  prefectureLede,
  type PrefecturePage,
} from "@/lib/editorial/prefectures";
import { artViewTransitionName } from "@/lib/editorial/artTransition";

/**
 * One prefecture's page body: art, data-composed lede, the 12-indicator
 * average profile, the brand list, and the furusato doorway. Copy is
 * composed from catalogue values only — no per-prefecture prose to keep
 * in sync when brands are added.
 */
export function PrefectureView({
  page,
  siblings,
}: {
  page: PrefecturePage;
  siblings: PrefecturePage[];
}) {
  return (
    <article className="pb-20">
      <div className={`${SITE_COLUMN} pt-4`}>
        <header>
          <p className="text-[12px] tracking-[0.08em] text-[var(--km-muted)]">
            産地｜{page.region}
          </p>
          <h1 className="mt-1.5 font-serif text-[1.85rem] font-semibold tracking-tight text-[var(--km-ink)] sm:text-[2.1rem]">
            {page.prefecture}の米
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--km-ink-soft)]">
            {prefectureLede(page)}
          </p>
        </header>
        <EditorialArt
          src={prefectureArtPath(page.slug)}
          alt={`${page.prefecture}の産地`}
          className="km-figure-wide mt-6"
          sizes="(min-width: 768px) 52rem, 100vw"
          quality={90}
          priority
          objectPosition="50% 42%"
          transitionName={artViewTransitionName("prefecture", page.slug)}
        />
      </div>

      <div className={`${SITE_COLUMN} mt-10`}>
        <section className={READING_COLUMN}>
          <h2 className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]">
            味わいの平均像
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-[var(--km-muted)]">
            {page.prefecture}の{page.brands.length}
            銘柄について、12指標を平均したものです。銘柄ごとの差は各銘柄ページにあります。
          </p>
          <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {page.traits.map((trait) => (
              <div
                key={trait.key}
                className="grid grid-cols-[7.5rem_minmax(0,1fr)_2.2rem] items-center gap-3"
              >
                <dt className="text-[13px] text-[var(--km-ink-soft)]">
                  {trait.label}
                </dt>
                <dd className="h-1.5 overflow-hidden rounded-full bg-[var(--km-bg-soft)]">
                  <span
                    className="block h-full rounded-full bg-[var(--km-gold)]"
                    style={{ width: `${(trait.value / 5) * 100}%` }}
                  />
                </dd>
                <dd className="text-right text-[13px] tabular-nums text-[var(--km-ink)]">
                  {trait.value.toFixed(1)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className={SITE_COLUMN}>
        <h2
          className={`${READING_COLUMN} mt-12 font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]`}
        >
          {page.prefecture}の銘柄
        </h2>
        <ol className="mx-auto mt-4 max-w-[52rem] divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]">
          {page.brands.map((brand, index) => {
            const odd = index % 2 === 0;
            return (
              <li key={brand.id}>
                <TransitionLink
                  href={`/library/${brand.id}`}
                  className={`group grid grid-cols-[5.75rem_minmax(0,1fr)] items-center gap-3.5 py-4 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-5 ${FOCUS}`}
                >
                  <BrandThumb
                    id={brand.id}
                    name={brand.name}
                    region={page.region}
                    prefecture={page.prefecture}
                    className={`w-full overflow-hidden ${odd ? "aspect-[4/5]" : "aspect-square"}`}
                    sizes="(min-width: 640px) 6.5rem, 5.75rem"
                  />
                  <span className="min-w-0">
                    <span className="text-[12px] text-[var(--km-muted)]">
                      {String(index + 1).padStart(2, "0")}
                      <span className="mx-2">{page.prefecture}</span>
                    </span>
                    <span className="mt-1 block font-serif text-[1.3rem] font-semibold tracking-tight text-[var(--km-ink)] group-hover:text-[var(--km-brown)] sm:text-[1.4rem]">
                      {brand.name}
                    </span>
                    {brand.headline ? (
                      <span className="mt-1.5 line-clamp-2 block text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
                        {brand.headline}
                      </span>
                    ) : null}
                  </span>
                </TransitionLink>
              </li>
            );
          })}
        </ol>
      </div>

      <div className={`${SITE_COLUMN} mt-12`}>
        <section className={READING_COLUMN}>
          <h2 className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]">
            ふるさと納税で、この土地の米を
          </h2>
          <p className="mt-3 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
            ふるさと納税では、寄附先の自治体の返礼品として、その土地の米が並びます。
            {page.prefecture}
            の米を選ぶなら、{prefectureAreaWord(page.prefecture)}
            の自治体への寄附が入口です。量や定期便の有無は自治体ごとに違うので、各銘柄ページの「お店で探す」にある「ふるさと納税」のタブで見比べられます。選び方の流れは特集にまとめました。
          </p>
          <p className="mt-3">
            <Link
              href="/collections/furusato-nozei"
              className={`text-[14px] text-[var(--km-brown)] underline-offset-2 hover:underline ${FOCUS}`}
            >
              特集「ふるさと納税で、産地の米を選ぶ」を読む
            </Link>
          </p>
        </section>

        {siblings.length > 0 ? (
          <section className={`${READING_COLUMN} mt-10`}>
            <h2 className="text-[13px] font-semibold tracking-wide text-[var(--km-ink)]">
              同じ{page.region}の産地
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {siblings.map((sibling) => (
                <li key={sibling.slug}>
                  <Link
                    href={`/prefectures/${sibling.slug}`}
                    className={`inline-flex rounded-full border border-[var(--km-border)] px-3 py-1.5 text-[13px] text-[var(--km-ink-soft)] transition hover:bg-[var(--km-surface-warm)] ${FOCUS}`}
                  >
                    {sibling.prefecture}（{sibling.brands.length}）
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}
