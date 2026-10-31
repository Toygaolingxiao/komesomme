import Link from "next/link";
import { FOCUS } from "@/components/matrix/shared";
import { SITE_COLUMN } from "@/components/siteChrome";

export type HomeStripPairing = { slug: string; dishLabel: string };
export type HomeStripCollection = { slug: string; title: string };
export type HomeStripBrand = { id: string; name: string; prefecture: string };

/**
 * Visible reading strip under the home map's first screen.
 *
 * Server-rendered from the same editorial data as /discover and /pair, so
 * the home page carries real, followable text and links below the map
 * instead of only the client-side matrix. The first screen itself is
 * unchanged; this sits under it and is reached by scrolling.
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
      className="border-t border-[var(--km-border)] bg-[var(--km-surface)] text-[var(--km-ink)]"
    >
      <div
        className={`${SITE_COLUMN} pb-[max(6.5rem,calc(env(safe-area-inset-bottom)+5rem))] pt-10 sm:pt-12 lg:pb-14`}
      >
        <h2 className="font-serif text-[1.3rem] font-semibold tracking-tight">
          このサイトについて
        </h2>
        <p className="mt-3 max-w-[40rem] text-[14px] leading-[1.9] text-[var(--km-ink-soft)]">
          日本のブランド米{brandCount}
          銘柄を、甘みと粒感を軸にした味わいの地図に置いて探せるサイトです。銘柄ごとに、味わいの目安と合う料理、産地のことを事典にまとめています。地図で探すほか、料理から選んだり、侍米師に相談したりもできます。運営と価格の出所は<Link href="/about" className={`text-[var(--km-brown)] hover:underline ${FOCUS}`}>サイトについて</Link>にまとめています。
        </p>

        <div className="mt-10 grid gap-9 sm:grid-cols-3 sm:gap-6">
          <nav aria-label="料理で選ぶ">
            <h3 className="font-serif text-[15px] font-semibold">料理で選ぶ</h3>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed">
              {pairings.map((pairing) => (
                <li key={pairing.slug}>
                  <Link
                    href={`/pair/${pairing.slug}`}
                    className={`text-[var(--km-ink-soft)] transition hover:text-[var(--km-brown)] ${FOCUS}`}
                  >
                    {pairing.dishLabel}に合う米
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/pair"
                  className={`font-medium text-[var(--km-brown)] transition hover:text-[var(--km-gold-ink)] ${FOCUS}`}
                >
                  料理の一覧へ
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="特集">
            <h3 className="font-serif text-[15px] font-semibold">特集</h3>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed">
              {collections.map((collection) => (
                <li key={collection.slug}>
                  <Link
                    href={`/collections/${collection.slug}`}
                    className={`text-[var(--km-ink-soft)] transition hover:text-[var(--km-brown)] ${FOCUS}`}
                  >
                    {collection.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/discover"
                  className={`font-medium text-[var(--km-brown)] transition hover:text-[var(--km-gold-ink)] ${FOCUS}`}
                >
                  ピックアップへ
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="きょうの銘柄">
            <h3 className="font-serif text-[15px] font-semibold">きょうの銘柄</h3>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed">
              {bowl.map((brand) => (
                <li key={brand.id}>
                  <Link
                    href={`/library/${brand.id}`}
                    className={`text-[var(--km-ink-soft)] transition hover:text-[var(--km-brown)] ${FOCUS}`}
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
                  className={`font-medium text-[var(--km-brown)] transition hover:text-[var(--km-gold-ink)] ${FOCUS}`}
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
