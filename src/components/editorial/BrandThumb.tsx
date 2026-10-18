import { EditorialArt } from "@/components/editorial/EditorialArt";
import { regionColor } from "@/components/matrix/shared";
import { resolveBrandArt } from "@/lib/editorial/art";

/**
 * Small brand mark. Dedicated illustrations stay. Prefecture maps and region
 * washes collapse to a paper tile — a green landmass at 48px does not read as rice.
 */
export function BrandThumb({
  id,
  name,
  region,
  prefecture,
  className = "",
  sizes = "4rem",
  transitionName,
}: {
  id: string;
  name: string;
  region: string;
  prefecture?: string | null;
  className?: string;
  sizes?: string;
  transitionName?: string;
}) {
  const art = resolveBrandArt(id, region, prefecture);
  if (art?.kind === "brand") {
    return (
      <EditorialArt
        src={art.src}
        alt=""
        className={className}
        sizes={sizes}
        quality={80}
        objectPosition="50% 42%"
        transitionName={transitionName}
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
