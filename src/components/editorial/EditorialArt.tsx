import Image from "next/image";

export function EditorialArt({
  src,
  alt,
  className,
  sizes = "(min-width: 768px) 50vw, 100vw",
  priority = false,
  quality = 72,
  objectPosition = "50% 50%",
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Next/Image quality 1–100. Default favors weight over print fidelity. */
  quality?: number;
  objectPosition?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-[var(--km-surface-warm)] ${className ?? ""}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        quality={quality}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="object-cover"
        style={{ objectPosition }}
      />
    </div>
  );
}
