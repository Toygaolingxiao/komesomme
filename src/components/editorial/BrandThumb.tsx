import { EditorialArt } from "@/components/editorial/EditorialArt";
import { regionColor } from "@/components/matrix/shared";
import { resolveBrandArt } from "@/lib/editorial/art";

/**
 * Brand picture. Uses the dedicated illustration, otherwise the prefecture
 * or region painting. A paper tile is only the fallback when no file exists.
 */
export function BrandThumb({
  id,
  name,
  region,
  prefecture,
  className = "",
  sizes = "4rem",
  transitionName,
  priority = false,
}: {
  id: string;
  name: string;
  region: string;
  prefecture?: string | null;
  className?: string;
  sizes?: string;
  transitionName?: string;
  /** Above-the-fold card that is the likely LCP image. */
  priority?: boolean;
}) {
  const art = resolveBrandArt(id, region, prefecture);
  if (art) {
    return (
      <EditorialArt
        src={art.src}
        alt={name}
        className={className}
        sizes={sizes}
        quality={80}
        priority={priority}
        objectPosition="50% 42%"
        transitionName={art.kind === "brand" ? transitionName : undefined}
      />
    );
  }

  const fill = regionColor(region);
  const mark = Array.from(name)[0] ?? "米";

  return (
    <div
      aria-hidden
      className={`grid place-items-center font-serif text-[1.15rem] text-[var(--km-ink)] ${className}`}
      style={{
        background: `color-mix(in srgb, ${fill} 28%, var(--km-surface-warm))`,
      }}
    >
      {mark}
    </div>
  );
}
