"use client";

import Link from "next/link";
import { BeerBottle, Flame, Heart, Snowflake, Sparkle, Warning, X } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import { track } from "@/lib/analytics";
import { GUIDE_CONSULT_LABEL, GUIDE_ROLE } from "@/lib/brand/guideRole";
import { FOCUS, ICON_WEIGHT } from "./shared";
import { useLateStage } from "./useStagedWait";

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
  pairing,
  onQueryChange,
  onSubmit,
  onResetMode,
}: {
  query: string;
  pending: boolean;
  failed: boolean;
  reply?: string | null;
  pairing?: { href: string; label: string } | null;
  onQueryChange: (value: string) => void;
  onSubmit: (text?: string) => void;
  onResetMode?: () => void;
}) {
  const hasQuery = query.trim().length > 0;
  const reduceMotion = useReducedMotion() ?? false;
  const empty = !hasQuery && !pending;
  const waitLate = useLateStage(pending);

  const title = (
    <div className="min-w-0 lg:self-center">
      <h3 className="font-serif text-[15px] font-semibold tracking-tight text-[var(--km-ink)]">
        侍米師に聞く
      </h3>
      <p className="mt-0.5 text-[12px] leading-snug text-[var(--km-muted)]">
        {failed
          ? "言葉を変えるか、味わいの地図から探してみてください。"
          : pending
            ? waitLate
              ? "侍米師のひとことを用意しています。"
              : "近い銘柄を探しています。"
            : reply
              ? "言葉を変えて、続けて聞けます。"
              : "料理の名前でも、今夜の気分でも構いません。"}
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
      className={`inline-flex h-11 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed ${FOCUS} ${
        empty
          ? "border border-[var(--km-brown)] bg-transparent text-[var(--km-brown)] shadow-none"
          : "text-white shadow-[0_8px_18px_rgba(229,107,63,0.28)] hover:enabled:-translate-y-px"
      }`}
      style={
        empty
          ? undefined
          : { background: "linear-gradient(180deg, var(--km-accent) 0%, var(--km-accent-deep) 100%)" }
      }
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
    <ul className="km-consult-examples flex max-w-full flex-wrap gap-1.5 lg:flex-nowrap lg:overflow-x-auto lg:pb-0.5 lg:[-ms-overflow-style:none] lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
      {EXAMPLES.map(({ text, Icon }) => (
        <li key={text}>
          <button
            type="button"
            onClick={() => {
              track("suggestion_chip_click", { text });
              onQueryChange(text);
              onSubmit(text);
            }}
            className={`inline-flex items-center gap-1 rounded-md border border-[var(--km-brown)]/35 bg-[var(--km-surface-warm)] px-2.5 py-1.5 text-[12px] leading-snug text-[var(--km-ink)] transition active:translate-y-0 [@media(hover:hover)]:hover:-translate-y-px ${FOCUS}`}
          >
            <Icon size={13} weight={ICON_WEIGHT} />
            {text}
          </button>
        </li>
      ))}
    </ul>
  );

  const slot = (
    <div className="flex min-h-11 min-w-0 items-start lg:items-center">
      {failed ? (
        <p className="flex min-w-0 items-start gap-2 text-[12px] leading-relaxed text-[var(--km-accent-ink)]">
          <Warning size={13} weight={ICON_WEIGHT} className="mt-0.5 shrink-0" />
          {reply?.trim() ||
            "うまく拾えませんでした。言葉を変えて、もう一度どうぞ。"}
        </p>
      ) : reply ? (
        <div
          className="flex w-full min-w-0 flex-col items-stretch gap-2 lg:flex-row lg:items-center lg:justify-between"
        >
          <motion.p
            key={reply}
            className="min-w-0 text-[13px] leading-relaxed text-[var(--km-ink)] lg:line-clamp-2 lg:leading-snug"
            initial={
              reduceMotion ? false : { opacity: 0, y: 4, filter: "blur(4px)" }
            }
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
          >
            <span className="mr-1.5 text-[12px] font-medium text-[var(--km-brown)]">
              {GUIDE_ROLE}
            </span>
            {reply}
            {pairing ? (
              <Link
                href={pairing.href}
                className={`ml-2 inline text-[12px] text-[var(--km-brown)] underline-offset-4 hover:underline ${FOCUS}`}
              >
                比較表で見る
              </Link>
            ) : null}
          </motion.p>
          {onResetMode ? (
            <button
              type="button"
              onClick={onResetMode}
              className={`shrink-0 self-start whitespace-nowrap rounded-full px-2 py-1 text-[12px] text-[var(--km-muted)] transition hover:text-[var(--km-gold-ink)] ${FOCUS}`}
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
      className="min-w-0 w-full shrink-0 lg:rounded-[1.25rem] lg:border lg:border-[var(--km-border)] lg:bg-[var(--km-surface)]/95 lg:px-5 lg:py-3 lg:shadow-[0_12px_32px_-28px_rgba(112,69,34,0.28)]"
    >
      <form
        className="flex flex-col gap-2.5 lg:grid lg:grid-cols-[11.5rem_minmax(0,1fr)_14rem] lg:grid-rows-[auto_auto] lg:items-center lg:gap-x-3 lg:gap-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          track("language_search_submit");
          onSubmit();
        }}
      >
        {title}
        {field}
        {submit}
        <div className="min-w-0 lg:col-span-3">{slot}</div>
      </form>
    </div>
  );
}
