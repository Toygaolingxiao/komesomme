import { LibraryDossierLink } from "@/components/library/LibraryDossierLink";
import { loadEncyclopediaArticle } from "@/data/rice/encyclopedia/load";

/** Cooking is unique to the encyclopedia; tasting copy stays on the brand page. */
export function LibraryCookingExcerpt({ riceId }: { riceId: string }) {
  const article = loadEncyclopediaArticle(riceId);
  const tips = article?.cookingTips.slice(0, 2) ?? [];
  if (tips.length === 0) {
    return (
      <p className="mt-8">
        <LibraryDossierLink riceId={riceId} />
      </p>
    );
  }

  return (
    <section className="mt-10 max-w-[52ch]">
      <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">
        美味しく炊く
      </h2>
      <p className="mt-1 text-[11px] tracking-[0.08em] text-[var(--km-muted)]">
        銘柄ライブラリより。由来や購入の目安は事典で。
      </p>
      <ol className="mt-4 space-y-4">
        {tips.map((tip, index) => (
          <li key={tip.title} className="flex gap-3">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--km-surface-warm)] font-serif text-[12px] text-[var(--km-brown)]">
              {index + 1}
            </span>
            <div>
              <h3 className="text-[13px] font-semibold text-[var(--km-ink)]">
                {tip.title}
              </h3>
              <p className="mt-1.5 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
                {tip.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4">
        <LibraryDossierLink riceId={riceId}>
          由来・特徴・購入の目安をライブラリで読む
        </LibraryDossierLink>
      </p>
    </section>
  );
}
