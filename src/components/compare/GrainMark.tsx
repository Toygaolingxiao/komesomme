/** The site's rice-grain swatch: a region-coloured grain with a soft sheen. */
export function GrainMark({
  color,
  width = 30,
  height = 38,
  className = "",
}: {
  color: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block flex-none rounded-[50%/58%_58%_42%_42%] ${className}`}
      style={{
        width,
        height,
        background: color,
        boxShadow:
          "inset -4px -6px 8px rgba(255,255,255,.85), inset 3px 4px 6px rgba(112,69,34,.18)",
      }}
    />
  );
}
