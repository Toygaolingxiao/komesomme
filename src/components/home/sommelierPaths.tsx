import Link from "next/link";
import { FOCUS } from "@/components/matrix/shared";

export const SOMMELIER_PATHS = [
  {
    id: "touch" as const,
    label: "触る",
    title: "味わいの地図",
    dek: "甘みと粒感を指で動かして、今夜の一膳を探します。",
    href: "/#matrix",
  },
  {
    id: "ask" as const,
    label: "訊く",
    title: "侍米師に聞く",
    dek: "料理や気分を言葉にすると、近い銘柄を返します。",
    href: "/#consult",
  },
  {
    id: "read" as const,
    label: "読む",
    title: "料理で選ぶ",
    dek: "カレーや弁当など、献立から比較表で読めます。",
    href: "/pair",
  },
] as const;

export type SommelierPathId = (typeof SOMMELIER_PATHS)[number]["id"];

/** Shared path cards for prototypes and production curtain. */
export function SommelierPathList({
  onSelect,
  large = false,
}: {
  onSelect?: (id: SommelierPathId) => void;
  large?: boolean;
}) {
  return (
    <ul className={large ? "grid gap-3 sm:grid-cols-3" : "flex flex-wrap gap-2"}>
      {SOMMELIER_PATHS.map((path) => {
        const className = large
          ? `group block border border-[var(--km-border)] bg-[var(--km-surface)] p-4 text-left transition-[transform,opacity] duration-150 ease-out active:scale-[0.97] hover:border-[var(--km-brown)]/35 ${FOCUS}`
          : `inline-flex items-center gap-1.5 border border-[var(--km-border)] bg-[var(--km-surface)] px-3 py-1.5 text-[12px] transition-[transform,color] duration-150 ease-out active:scale-[0.97] hover:text-[var(--km-brown)] ${FOCUS}`;

        if (onSelect) {
          return (
            <li key={path.id}>
              <button type="button" className={className} onClick={() => onSelect(path.id)}>
                {large ? (
                  <>
                    <span className="text-[11px] tracking-[0.14em] text-[var(--km-muted)]">
                      {path.label}
                    </span>
                    <span className="mt-2 block font-serif text-[1.15rem] font-semibold text-[var(--km-ink)] group-hover:text-[var(--km-brown)]">
                      {path.title}
                    </span>
                    <span className="mt-1.5 block text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
                      {path.dek}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[var(--km-muted)]">{path.label}</span>
                    <span className="font-serif font-semibold">{path.title}</span>
                  </>
                )}
              </button>
            </li>
          );
        }

        return (
          <li key={path.id}>
            <Link href={path.href} className={className}>
              {large ? (
                <>
                  <span className="text-[11px] tracking-[0.14em] text-[var(--km-muted)]">
                    {path.label}
                  </span>
                  <span className="mt-2 block font-serif text-[1.15rem] font-semibold text-[var(--km-ink)] group-hover:text-[var(--km-brown)]">
                    {path.title}
                  </span>
                  <span className="mt-1.5 block text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
                    {path.dek}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[var(--km-muted)]">{path.label}</span>
                  <span className="font-serif font-semibold">{path.title}</span>
                </>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
