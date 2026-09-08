import Link from "next/link";
import type { SeoLink } from "@/lib/seo/jsonLd";

/**
 * Visible trail. Always pair with `breadcrumbListLd(crumbs)` so the markup and
 * the JSON-LD describe the same path — Google drops mismatched breadcrumbs.
 */
export function Breadcrumbs({
  crumbs,
  className,
}: {
  crumbs: SeoLink[];
  className?: string;
}) {
  if (crumbs.length < 2) return null;
  const trail = crumbs.slice(0, -1);
  const current = crumbs[crumbs.length - 1]!;

  return (
    <nav aria-label="現在の位置" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--km-muted)]">
        {trail.map((crumb) => (
          <li key={crumb.path} className="flex items-center gap-x-2">
            <Link
              className="underline-offset-2 hover:text-[var(--km-ink)] hover:underline"
              href={crumb.path}
            >
              {crumb.name}
            </Link>
            <span aria-hidden>›</span>
          </li>
        ))}
        <li aria-current="page" className="text-[var(--km-ink-soft)]">
          {current.name}
        </li>
      </ol>
    </nav>
  );
}
