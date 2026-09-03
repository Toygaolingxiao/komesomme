import type { ReactNode } from "react";
import { BRAND, GRAIN_PATH } from "@/components/brand/markGeometry";

function MarkFrame({
  children,
  title,
  className,
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      className={className}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

const ink = BRAND.charcoal;
const gold = BRAND.gold;

/** Rice grain resting in a shallow bowl. Library editorial sections only. */
export function BowlMark({ className, title }: { className?: string; title?: string }) {
  return (
    <MarkFrame className={className} title={title}>
      <g transform="translate(10 2) scale(0.68)">
        <path
          d={GRAIN_PATH}
          fill="none"
          stroke={ink}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </g>
      <path
        d="M12 44C16 52 24 56 32 56C40 56 48 52 52 44"
        stroke={ink}
        strokeWidth="1.85"
        strokeLinecap="round"
      />
      <path d="M18 44H46" stroke={gold} strokeWidth="1.2" strokeLinecap="round" />
    </MarkFrame>
  );
}

/** Grain over a simple calendar plate. */
export function CalendarMark({ className, title }: { className?: string; title?: string }) {
  return (
    <MarkFrame className={className} title={title}>
      <rect
        x="14"
        y="16"
        width="36"
        height="34"
        rx="4"
        stroke={ink}
        strokeWidth="1.85"
      />
      <path d="M22 16V12M42 16V12" stroke={ink} strokeWidth="1.85" strokeLinecap="round" />
      <path d="M14 26H50" stroke={gold} strokeWidth="1.2" />
      <g transform="translate(16 24) scale(0.5)">
        <path
          d={GRAIN_PATH}
          fill="none"
          stroke={ink}
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      </g>
    </MarkFrame>
  );
}

/** Three steam curls above a grain. */
export function SteamMark({ className, title }: { className?: string; title?: string }) {
  return (
    <MarkFrame className={className} title={title}>
      <path
        d="M22 22C22 16 26 14 26 10M32 20C32 14 36 13 36 8M42 22C42 17 45 15 45 11"
        stroke={gold}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <g transform="translate(10 16) scale(0.68)">
        <path
          d={GRAIN_PATH}
          fill="none"
          stroke={ink}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </g>
    </MarkFrame>
  );
}
