import { isTokuA } from "@/data/rice/tokuA";
import { TokuABadge } from "@/components/rice/TokuABadge";

export function BrandNameMeta({
  id,
  reading,
}: {
  id: string;
  reading?: string | null;
}) {
  const bits = [reading?.trim() || null].filter(Boolean);
  const tokuA = isTokuA(id);

  if (bits.length === 0 && !tokuA) return null;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
      {tokuA ? <TokuABadge /> : null}
      {bits.length > 0 ? (
        <p className="text-[13px] text-[var(--km-muted)]">{bits.join(" · ")}</p>
      ) : null}
    </div>
  );
}
