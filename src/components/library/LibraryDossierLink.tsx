import type { ReactNode } from "react";
import Link from "next/link";
import { FOCUS } from "@/components/matrix/shared";

/** Client-safe. Map / modal stay tasting-first; the dossier lives on /library. */
export function LibraryDossierLink({
  riceId,
  children,
}: {
  riceId: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={`/library/${riceId}`}
      className={`inline-flex w-fit items-center gap-1 text-[12px] text-[var(--km-ink-soft)] transition hover:text-[var(--km-gold)] ${FOCUS}`}
    >
      {children ?? "由来と炊き方をライブラリで読む"}
    </Link>
  );
}
