import Link from "next/link";
import { FOCUS } from "@/components/matrix/shared";
import { SITE_COLUMN } from "@/components/siteChrome";

const CARD =
  "overflow-hidden rounded-2xl border border-[var(--km-border)] bg-[var(--km-brown)]/[0.035]";
const ROW = `flex min-h-11 items-center justify-between gap-2 rounded-lg px-2.5 py-2 transition hover:bg-[var(--km-brown)]/[0.06] ${FOCUS}`;

export type HomeStripPairing = { slug: string; dishLabel: string };
export type HomeStripCollection = { slug: string; title: string };
export type HomeStripBrand = { id: string; name: string; prefecture: string };

/**
 * Crawler-facing reading copy under the home map.
 *
 * Server-rendered from the same editorial data as /discover and /pair so
 * the home HTML still has followable text. It is visually hidden on every
 * viewport (`sr-only`): people stay on the map; crawlers still get the
 * links. Do not put it back in the document flow.
 */
export function HomeReadingStrip({
  brandCount,
  pairings,
  collections,
  bowl,
}: {
  brandCount: number;
  pairings: HomeStripPairing[];
  collections: HomeStripCollection[];
  bowl: HomeStripBrand[];
}) {
  return (
    <section
      aria-label="サイトの案内"
      className="sr-only"
    >
      <div
        className={`${SITE_COLUMN} pb-[max(6.5rem,calc(env(safe-area-inset-bottom)+5rem))] pt-10 sm:pt-12 lg:pb-14`}
      >
        {/* Collapsed by default; the text stays in the server HTML (native
            details), so readers and crawlers still get it, and one tap opens it. */}
        <details className="group max-w-[40rem]">
          <summary
            className={`flex cursor-pointer list-none items-center gap-2 font-serif text-[1.3rem] font-semibold tracking-tight marker:content-none [&::-webkit-details-marker]:hidden ${FOCUS}`}
          >
            このサイトについて
            <span
              aria-hidden
              className="inline-block h-2 w-2 rotate-45 border-b-2 border-r-2 border-[var(--km-muted)] transition group-open:-rotate-[135deg]"
            />
          </summary>
          <p className="mt-3 text-[14px] leading-[1.9] text-[var(--km-ink-soft)]">
            日本のブランド米{brandCount}
            銘柄を、甘みと粒感を軸にした味わいの地図に置いて探せるサイトです。銘柄ごとに、味わいの目安と合う料理、産地のことを事典にまとめています。地図で探すほか、料理から選んだり、侍米師に相談したりもできます。運営と価格の出所は<Link href="/about" className={`text-[var(--km-brown)] hover:underline ${FOCUS}`}>サイトについて</Link>にまとめています。
          </p>
        </details>

        <div className="mt-9 grid gap-4 sm:grid-cols-3 sm:gap-5">
          <nav className={CARD} aria-label="料理で選ぶ">
            <h3 className="px-4 pb-1 pt-4 font-serif text-[15px] font-semibold">料理で選ぶ</h3>
            <ul className="px-1.5 pb-2 text-[13px] leading-relaxed">
              {pairings.map((pairing) => (
                <li key={pairing.slug}>
                  <Link
                    href={`/pair/${pairing.slug}`}
                    className={`${ROW} text-[var(--km-ink-soft)] hover:text-[var(--km-brown)]`}
                  >
                    {pairing.dishLabel}に合う米
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/pair"
                  className={`${ROW} font-medium text-[var(--km-brown)] hover:text-[var(--km-gold-ink)]`}
                >
                  料理の一覧へ
                </Link>
              </li>
            </ul>
          </nav>

          <nav className={CARD} aria-label="特集">
            <h3 className="px-4 pb-1 pt-4 font-serif text-[15px] font-semibold">特集</h3>
            <ul className="px-1.5 pb-2 text-[13px] leading-relaxed">
              {collections.map((collection) => (
                <li key={collection.slug}>
                  <Link
                    href={`/collections/${collection.slug}`}
                    className={`${ROW} text-[var(--km-ink-soft)] hover:text-[var(--km-brown)]`}
                  >
                    {collection.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/discover"
                  className={`${ROW} font-medium text-[var(--km-brown)] hover:text-[var(--km-gold-ink)]`}
                >
                  ピックアップへ
                </Link>
              </li>
            </ul>
          </nav>

          <nav className={CARD} aria-label="きょうの銘柄">
            <h3 className="px-4 pb-1 pt-4 font-serif text-[15px] font-semibold">きょうの銘柄</h3>
            <ul className="px-1.5 pb-2 text-[13px] leading-relaxed">
              {bowl.map((brand) => (
                <li key={brand.id}>
                  <Link
                    href={`/library/${brand.id}`}
                    className={`${ROW} text-[var(--km-ink-soft)] hover:text-[var(--km-brown)]`}
                  >
                    {brand.name}
                    <span className="text-[var(--km-muted)]">
                      （{brand.prefecture}）
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/library"
                  className={`${ROW} font-medium text-[var(--km-brown)] hover:text-[var(--km-gold-ink)]`}
                >
                  ライブラリへ
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </section>
  );
}
