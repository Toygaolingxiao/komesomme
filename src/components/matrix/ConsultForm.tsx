"use client";

import { BeerBottle, Flame, Heart, Snowflake, Sparkle, Warning } from "@phosphor-icons/react";
import { FOCUS, ICON_WEIGHT, TAG_TONES } from "./shared";

const EXAMPLES: Array<{ text: string; Icon: typeof Sparkle }> = [
  { text: "ハイボールと唐揚げに合う米", Icon: BeerBottle },
  { text: "冷めても美味しいお弁当用", Icon: Snowflake },
  { text: "疲れた日にやさしいご飯", Icon: Heart },
  { text: "冬の鍋に合う、甘みのある米", Icon: Flame },
];

/**
 * Free-text consultation.
 *
 * The only path that reaches the server: the query is embedded there and matched
 * against stored vectors, keeping the map and sliders entirely local.
 */
export function ConsultForm({
  query,
  pending,
  failed,
  onQueryChange,
  onSubmit,
}: {
  query: string;
  pending: boolean;
  failed: boolean;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div id="consult" className="mt-auto shrink-0 border-t border-[var(--km-border)] pt-3">
      <h3 className="font-serif text-[15px] font-semibold tracking-tight text-[var(--km-ink)]">
        言葉でえらぶ、今日の一膳
      </h3>
      <p className="mt-1 text-[11px] leading-relaxed text-[var(--km-muted)]">
        料理・お酒・気分を一言で。米ソムリエが味わいの近い銘柄を探します。
      </p>

      <form
        className="mt-3 flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label htmlFor="km-query" className="sr-only">
          料理や好み
        </label>
        <input
          id="km-query"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="例：刺身に合う、冷めても美味しい、ウイスキーと合わせたい"
          className="w-full rounded-xl border border-[var(--km-border)] bg-[var(--km-surface)] px-3 py-2 text-sm text-[var(--km-ink)] placeholder:text-[var(--km-muted)] focus:border-[var(--km-accent)] focus:outline-none"
        />

        <ul className="flex flex-wrap gap-1.5">
          {EXAMPLES.map(({ text, Icon }, index) => {
            const tone = TAG_TONES[index % TAG_TONES.length];
            return (
              <li key={text}>
                <button
                  type="button"
                  onClick={() => onQueryChange(text)}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] leading-snug transition hover:-translate-y-px active:translate-y-0 ${FOCUS}`}
                  style={{
                    background: tone.bg,
                    border: `1px solid ${tone.border}`,
                    color: tone.text,
                  }}
                >
                  <Icon size={11} weight={ICON_WEIGHT} />
                  {text}
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="submit"
          disabled={pending || query.trim().length === 0}
          className={`inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(229,107,63,0.28)] transition hover:-translate-y-px hover:shadow-[0_10px_20px_rgba(229,107,63,0.34)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${FOCUS}`}
          style={{
            background: "linear-gradient(180deg, #e56b3f 0%, #c85a28 100%)",
          }}
        >
          <Sparkle size={14} weight={ICON_WEIGHT} />
          {pending ? "読み解いています" : "一膳を提案してもらう"}
        </button>
      </form>

      {failed ? (
        <p className="mt-2 flex items-start gap-2 text-[11px] leading-relaxed text-[#a33b2a]">
          <Warning size={13} weight={ICON_WEIGHT} className="mt-0.5 shrink-0" />
          うまく読み取れませんでした。言葉を変えて、もう一度どうぞ。
        </p>
      ) : null}
    </div>
  );
}
