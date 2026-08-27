"use client";

import { Sparkle, Warning } from "@phosphor-icons/react";
import { FOCUS, ICON_WEIGHT } from "./shared";

const EXAMPLES = [
  "ハイボールと唐揚げに合う米",
  "冷めても美味しいお弁当用",
  "疲れた日にやさしいご飯",
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
    <div className="mt-auto shrink-0 border-t border-[var(--km-border)] pt-5">
      <h3 className="text-base font-semibold tracking-tight text-[var(--km-ink)]">
        米ソムリエに相談
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--km-ink-soft)]">
        料理・気分・お酒の言葉から、今日の一膳を探します。
      </p>

      <form
        className="mt-5 flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label htmlFor="km-query" className="text-xs text-[var(--km-ink-soft)]">
          料理や好み
        </label>
        <input
          id="km-query"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="例：刺身に合う、冷めても美味しい、ウイスキーと合わせたい"
          className="w-full rounded-lg border-0 border-b border-[var(--km-border)] bg-transparent px-0 py-2.5 text-sm text-[var(--km-ink)] placeholder:text-[var(--km-muted)] focus:border-[var(--km-accent)] focus:outline-none focus-visible:ring-0"
        />

        <ul className="mt-1 flex flex-wrap gap-1.5">
          {EXAMPLES.map((example) => (
            <li key={example}>
              <button
                type="button"
                onClick={() => onQueryChange(example)}
                className={`rounded-full border border-[var(--km-border)] px-2.5 py-1 text-[11px] text-[var(--km-muted)] transition hover:border-[var(--km-gold)]/40 hover:text-[var(--km-ink)] ${FOCUS}`}
              >
                {example}
              </button>
            </li>
          ))}
        </ul>

        <button
          type="submit"
          disabled={pending || query.trim().length === 0}
          className={`mt-2 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--km-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--km-gold-strong)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
        >
          <Sparkle size={15} weight={ICON_WEIGHT} />
          {pending ? "味わいを読み解いています" : "一膳を提案してもらう"}
        </button>
      </form>

      {failed ? (
        <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-rose-700">
          <Warning size={13} weight={ICON_WEIGHT} className="mt-0.5 shrink-0" />
          うまく読み取れませんでした。少し言葉を変えて、もう一度お試しください。
        </p>
      ) : (
        <p className="mt-4 max-w-[40ch] text-xs leading-relaxed text-[var(--km-muted)]">
          料理や好みの言葉から、味わいの近い銘柄を探します。
        </p>
      )}
    </div>
  );
}
