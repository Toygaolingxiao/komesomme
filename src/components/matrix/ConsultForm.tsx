"use client";

import { BeerBottle, Flame, Heart, Snowflake, Sparkle, Warning, X } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { track } from "@/lib/analytics";
import { GUIDE_CONSULT_LABEL, GUIDE_ROLE } from "@/lib/brand/guideRole";
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
 * Desktop keeps one two-row grid for idle, pending, and reply. Examples and the
 * sommelier reply swap in the same slot so the map and rail above do not resize.
 * Mobile stack may grow with the reply and wraps example chips.
 */
export function ConsultForm({
  query,
  pending,
  failed,
  reply,
  onQueryChange,
  onSubmit,
  onResetMode,
  layout = "stack",
}: {
  query: string;
  pending: boolean;
  failed: boolean;
  reply?: string | null;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  onResetMode?: () => void;
  layout?: "stack" | "wide";
}) {
  const wide = layout === "wide";
  const hasQuery = query.trim().length > 0;
  const reduceMotion = useReducedMotion() ?? false;

  const title = (
    <div className={wide ? "min-w-0 self-center" : undefined}>
      <h3 className="font-serif text-[15px] font-semibold tracking-tight text-[var(--km-ink)] sm:text-[15px]">
        侍米師に聞く
      </h3>
      <p className="mt-0.5 text-[11px] leading-snug text-[var(--km-muted)]">
        {failed
          ? "言葉を変えるか、味わいの地図から探してみてください。"
          : reply
            ? "言葉を変えて、続けて聞けます。"
            : "料理の名前でも、今夜の気分でも構いません。味わいの地図と、献立からの比較表のあいだをつなぎます。"}
      </p>
    </div>
  );

  const field = (
    <div className="min-w-0">
      <label htmlFor="km-query" className="sr-only">
        料理や好み
      </label>
      <div className="relative">
        <input
          id="km-query"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={
            reply
              ? "料理・酒・気分を変えて、続けて聞く"
              : wide
                ? "例：刺身に合う、冷めても美味しい、ウイスキーと合わせたい"
                : "例：刺身に合う、冷めても美味しい"
          }
          className={`h-11 w-full min-w-0 rounded-lg border border-[var(--km-border)] bg-[var(--km-surface)] py-2 text-sm text-[var(--km-ink)] placeholder:text-[var(--km-muted)] focus:border-[var(--km-gold)] focus:outline-none ${
            hasQuery ? "px-3 pr-9" : "px-3"
          }`}
        />
        {hasQuery ? (
          <button
            type="button"
            aria-label="入力を消す"
            onClick={() => onQueryChange("")}
            className={`absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[var(--km-muted)] transition hover:bg-[var(--km-surface)] hover:text-[var(--km-ink)] ${FOCUS}`}
          >
            <X size={12} weight="bold" />
          </button>
        ) : null}
      </div>
    </div>
  );

  const submit = (
    <button
      type="submit"
      disabled={pending || !hasQuery}
      className={`inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(229,107,63,0.28)] transition hover:-translate-y-px hover:shadow-[0_10px_20px_rgba(229,107,63,0.34)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${FOCUS} ${
        wide ? "w-full" : "mt-1 w-full"
      }`}
      style={{
        background: "linear-gradient(180deg, var(--km-accent) 0%, var(--km-accent-deep) 100%)",
      }}
    >
      <Sparkle size={14} weight={ICON_WEIGHT} />
      {pending
        ? "探しています"
        : reply
          ? "もう一度聞く"
          : GUIDE_CONSULT_LABEL}
    </button>
  );

  const examples = (
    <ul
      className={
        wide
          ? "km-consult-examples flex max-w-full flex-nowrap gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex flex-wrap gap-1.5"
      }
    >
      {EXAMPLES.map(({ text, Icon }, index) => {
        const tone = TAG_TONES[index % TAG_TONES.length];
        return (
          <li key={text}>
            <button
              type="button"
              onClick={() => {
                track("suggestion_chip_click", { text });
                onQueryChange(text);
              }}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-[10px] leading-snug transition hover:-translate-y-px active:translate-y-0 ${FOCUS}`}
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
  );

  const slot = (
    <div
      className={
        wide
          ? "flex h-11 min-w-0 items-center overflow-hidden"
          : "flex min-h-11 min-w-0 items-start"
      }
    >
      {failed ? (
        <p className="flex min-w-0 items-start gap-2 text-[11px] leading-relaxed text-[var(--km-accent-deep)]">
          <Warning size={13} weight={ICON_WEIGHT} className="mt-0.5 shrink-0" />
          {reply?.trim() ||
            "うまく拾えませんでした。言葉を変えて、もう一度どうぞ。"}
        </p>
      ) : reply ? (
        <div
          className={`flex w-full min-w-0 gap-3 ${
            wide ? "items-center justify-between" : "flex-col items-stretch"
          }`}
        >
          <motion.p
            key={reply}
            className={`min-w-0 text-[13px] leading-snug text-[var(--km-ink)] ${
              wide ? "line-clamp-2" : "leading-relaxed"
            }`}
            initial={
              reduceMotion ? false : { opacity: 0, y: 4, filter: "blur(4px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className="mr-1.5 text-[11px] font-medium text-[var(--km-brown)]">
              {GUIDE_ROLE}
            </span>
            {reply}
          </motion.p>
          {onResetMode ? (
            <button
              type="button"
              onClick={onResetMode}
              className={`shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-[11px] text-[var(--km-muted)] transition hover:text-[var(--km-gold)] ${FOCUS} ${
                wide ? "" : "self-start"
              }`}
            >
              地図で選び直す
            </button>
          ) : null}
        </div>
      ) : (
        examples
      )}
    </div>
  );

  return (
    <div
      id="consult"
      className={
        wide
          ? "min-w-0 w-full rounded-[1.25rem] border border-[var(--km-border)] bg-[var(--km-surface)]/95 px-4 py-3 shadow-[0_12px_32px_-28px_rgba(112,69,34,0.28)] sm:px-5"
          : "min-w-0 shrink-0"
      }
    >
      <form
        className={
          wide
            ? "grid grid-cols-[11.5rem_minmax(0,1fr)_14rem] grid-rows-[2.75rem_2.75rem] items-center gap-x-3 gap-y-2"
            : "flex flex-col gap-2.5"
        }
        onSubmit={(event) => {
          event.preventDefault();
          track("language_search_submit");
          onSubmit();
        }}
      >
        {title}
        {field}
        {submit}
        {wide ? <div className="col-span-3 min-w-0">{slot}</div> : slot}
      </form>
    </div>
  );
}
