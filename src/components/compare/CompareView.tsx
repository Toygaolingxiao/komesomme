import Link from "next/link";
import { CompareMiniMap } from "@/components/compare/CompareMiniMap";
import { GrainMark } from "@/components/compare/GrainMark";
import { IndicatorTable } from "@/components/compare/IndicatorTable";
import { TokuABadge } from "@/components/rice/TokuABadge";
import { ShopLinksStrip } from "@/components/ShopLinksStrip";
import { FOCUS } from "@/components/matrix/shared";
import type { ResolvedComparison } from "@/lib/editorial/comparisons";
import { regionColor } from "@/lib/rice/regions";
import type { RiceProfileV2 } from "@/types/rice";

function SectionTitle({ children, note }: { children: string; note?: string }) {
  return (
    <h2 className="flex flex-wrap items-center gap-x-3 border-b-2 border-[var(--km-gold)] pb-2 font-serif text-[1.3rem] font-semibold text-[var(--km-ink)]">
      <GrainMark color="var(--km-gold)" width={11} height={14} />
      {children}
      {note ? (
        <small className="text-[11.5px] font-normal tracking-wide text-[var(--km-muted)]">
          {note}
        </small>
      ) : null}
    </h2>
  );
}

function BrandHead({ rice }: { rice: RiceProfileV2 }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-[var(--km-border)] bg-white px-4 py-3">
      <span
        aria-hidden="true"
        className="h-[38px] w-[30px] flex-none rounded-[50%/58%_58%_42%_42%]"
        style={{
          background: regionColor(rice.region),
          boxShadow:
            "inset -4px -6px 8px rgba(255,255,255,.85), inset 3px 4px 6px rgba(112,69,34,.18)",
        }}
      />
      <div className="min-w-0">
        <Link
          href={`/library/${rice.id}`}
          className={`font-serif text-[17px] font-semibold text-[var(--km-ink)] underline-offset-4 hover:underline ${FOCUS}`}
        >
          {rice.name}
        </Link>
        <div className="text-[12px] text-[var(--km-muted)]">
          {rice.prefecture}
        </div>
      </div>
      <span className="ml-auto flex-none">
        <TokuABadge id={rice.id} />
      </span>
    </div>
  );
}

function Chips({
  items,
  tone,
  color,
}: {
  items: string[];
  tone?: "a" | "b" | "shared";
  color?: string;
}) {
  if (items.length === 0) return null;
  const cls =
    tone === "shared"
      ? "border-[var(--km-gold)] bg-[var(--km-surface-warm)] text-[var(--km-brown)]"
      : "border-[var(--km-border)] bg-white text-[var(--km-ink)]";
  return (
    <div className="flex flex-wrap gap-[7px]">
      {items.map((item) => (
        <span
          key={item}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-[3px] text-[13px] ${cls}`}
        >
          {color ? (
            <span
              aria-hidden="true"
              className="h-[7px] w-[7px] rounded-full"
              style={{ background: color }}
            />
          ) : null}
          {item}
        </span>
      ))}
    </div>
  );
}

export function CompareView({ resolved }: { resolved: ResolvedComparison }) {
  const { page, a, b, related } = resolved;

  const sharedDishes = [...a.best_match_dishes, ...a.good_with].filter((dish) =>
    [...b.best_match_dishes, ...b.good_with].includes(dish),
  );
  const sharedAvoid = a.avoid_pairings.filter((item) =>
    b.avoid_pairings.includes(item),
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-[56rem] pb-20 pt-2">
      <div className="flex items-start justify-between gap-4">
        <span className="inline-block rounded-full border border-[var(--km-border)] bg-[var(--km-surface-warm)] px-3 py-[3px] text-[12px] tracking-[0.14em] text-[var(--km-brown)]">
          銘柄くらべ
        </span>
        <span aria-hidden="true" className="flex flex-none items-center pt-1">
          <GrainMark
            color={regionColor(a.region)}
            width={24}
            height={30}
            className="-rotate-12"
          />
          <span className="mx-1 text-[13px] text-[var(--km-muted)]">×</span>
          <GrainMark
            color={regionColor(b.region)}
            width={24}
            height={30}
            className="rotate-12"
          />
        </span>
      </div>
      <h1 className="mt-4 font-serif text-[1.75rem] font-semibold leading-[1.5] tracking-tight text-[var(--km-ink)] sm:text-[1.9rem]">
        {a.name}と{b.name}、どう違う？
      </h1>
      <p className="mt-3 max-w-[40rem] text-[15px] leading-[1.9] text-[var(--km-ink-soft)]">
        {page.dek}
      </p>

      {/* Verdict first (conclusion up top, per the page design). */}
      <section aria-label="結論" className="mt-8 grid items-start gap-3 sm:grid-cols-2">
        {[
          { rice: a, verdict: page.verdictA },
          { rice: b, verdict: page.verdictB },
        ].map(({ rice, verdict }) => (
          <div
            key={rice.id}
            className="rounded-lg border border-[var(--km-border)] bg-[var(--km-surface-warm)] p-4 shadow-[0_1px_3px_rgba(48,40,32,0.06)]"
            style={{ borderTop: `4px solid ${regionColor(rice.region)}` }}
          >
            <div className="text-[12.5px] text-[var(--km-muted)]">
              {verdict.when}
            </div>
            <div className="mt-1 flex items-center gap-2 font-serif text-[17px] font-semibold text-[var(--km-ink)]">
              <GrainMark
                color={regionColor(rice.region)}
                width={15}
                height={19}
              />
              → {rice.name}
            </div>
            <p className="mt-1 text-[13.5px] leading-[1.75] text-[var(--km-ink-soft)]">
              {verdict.text}
            </p>
          </div>
        ))}
      </section>

      <section aria-label="リード" className="mt-10">
        <SectionTitle>そもそも、なぜ迷うのか</SectionTitle>
        {page.lead.map((paragraph) => (
          <p
            key={paragraph.slice(0, 16)}
            className="mt-4 text-[15px] leading-[2] text-[var(--km-ink)]"
          >
            {paragraph}
          </p>
        ))}
      </section>

      <section aria-label="12指標の比較" className="mt-12">
        <SectionTitle note="数値は KomeSomme の編集評価（1〜5）／差のある行だけ色付け">
          12指標で並べる
        </SectionTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <BrandHead rice={a} />
          <BrandHead rice={b} />
        </div>
        <div className="mt-2">
          <IndicatorTable a={a} b={b} />
        </div>
      </section>

      <section aria-label="味わいの地図での位置" className="mt-12">
        <SectionTitle note="ホームの味わい地図と同じ配置">
          味わいの地図での位置
        </SectionTitle>
        <div className="mt-4 grid items-start gap-4 md:grid-cols-[1.15fr_0.85fr]">
          <CompareMiniMap a={a} b={b} />
          <p className="rounded-lg border border-[var(--km-border)] border-l-4 border-l-[var(--km-gold)] bg-[#FBF6EC] p-4 text-[13.5px] leading-[1.9] text-[var(--km-ink-soft)]">
            {page.coordinateNote}
          </p>
        </div>
      </section>

      <section aria-label="料理の重なりと違い" className="mt-12">
        <SectionTitle>料理の重なりと違い</SectionTitle>
        {sharedDishes.length > 0 ? (
          <>
            <div className="mt-4 text-[12.5px] text-[var(--km-muted)]">
              両方に共通する強み
            </div>
            <div className="mt-2">
              <Chips items={sharedDishes} tone="shared" />
            </div>
          </>
        ) : null}
        <div className="mt-4 text-[12.5px] text-[var(--km-muted)]">
          {a.name}に向く
        </div>
        <div className="mt-2">
          <Chips
            items={[...a.best_match_dishes, ...a.good_with]}
            tone="a"
            color={regionColor(a.region)}
          />
        </div>
        <div className="mt-4 text-[12.5px] text-[var(--km-muted)]">
          {b.name}に向く
        </div>
        <div className="mt-2">
          <Chips
            items={[...b.best_match_dishes, ...b.good_with]}
            tone="b"
            color={regionColor(b.region)}
          />
        </div>
      </section>

      <section aria-label="向かない組み合わせ" className="mt-12">
        <SectionTitle note="合わない組み合わせも、正直に置きます">
          向かない組み合わせ
        </SectionTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[a, b].map((rice) => (
            <div
              key={rice.id}
              className="rounded-lg border border-[var(--km-border)] border-l-4 border-l-[var(--km-accent)] bg-white p-4"
            >
              <div className="text-[14px] font-bold">{rice.name}</div>
              <p className="mt-1 text-[13.5px] leading-[1.75] text-[var(--km-ink-soft)]">
                {rice.avoid_pairings.join("／")}
              </p>
            </div>
          ))}
        </div>
        {sharedAvoid.length > 0 ? (
          <p className="mt-3 rounded-lg border border-[#EFD9C4] bg-[#FBF1E8] px-4 py-3 text-[13.5px] leading-[1.8] text-[#6B4423]">
            共通：{sharedAvoid.join("／")}
            には、どちらも甘みや粘りが勝ちすぎます。
          </p>
        ) : null}
      </section>

      <section aria-label="よくある疑問" className="mt-12">
        <SectionTitle>よくある疑問</SectionTitle>
        <div>
          {page.faq.map((item) => (
            <div
              key={item.q}
              className="mb-3 rounded-lg border border-[var(--km-border)] border-l-4 border-l-[var(--km-gold)] bg-white p-4 last:mb-0"
            >
              <div className="text-[14.5px] font-bold">
                <span className="text-[var(--km-accent-ink)]">Q. </span>
                {item.q}
              </div>
              <p className="mt-1 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="お店で探す" className="mt-12">
        <SectionTitle>お店で探す</SectionTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[a, b].map((rice) => (
            <div
              key={rice.id}
              className="rounded-lg border-[1.5px] border-[var(--km-brown)] bg-white p-4"
            >
              <div className="font-serif text-[16.5px] font-semibold">
                {rice.name}
              </div>
              <p className="mb-3 mt-1 text-[13px] text-[var(--km-muted)]">
                {rice.prefecture}／{rice.short_}
              </p>
              <ShopLinksStrip
                rice={rice}
                variant="compact"
                expandMode="always"
              />
            </div>
          ))}
        </div>
      </section>

      {related.length > 0 ? (
        <section aria-label="ほかの銘柄くらべ" className="mt-12">
          <SectionTitle>ほかの銘柄くらべ</SectionTitle>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((row) => (
              <li key={row.slug}>
                <Link
                  href={`/compare/${row.slug}`}
                  className={`flex h-full items-center gap-2 rounded-lg border border-[var(--km-border)] bg-white px-4 py-3 text-[14px] font-semibold text-[var(--km-ink)] transition-colors duration-150 hover:border-[var(--km-brown)]/35 ${FOCUS}`}
                >
                  <GrainMark color="var(--km-gold)" width={12} height={15} />
                  <span className="min-w-0 flex-1 leading-[1.6]">
                    {row.title.split("｜")[0]}
                  </span>
                  <span aria-hidden="true" className="text-[var(--km-muted)]">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-12 border-t border-[var(--km-border)] pt-4 text-[12px] leading-[1.8] text-[var(--km-muted)]">
        味わいの数値は KomeSomme
        の編集評価（1〜5）で、公的な測定値ではありません。特A
        は日本穀物検定協会の食味ランキング（令和7年産）によります。
      </p>
    </div>
  );
}
