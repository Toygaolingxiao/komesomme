/**
 * Shared page columns for SiteHeader, footer, editorial indexes, and reading bodies.
 * Do not invent a second horizontal padding scale for public surfaces.
 */
export const SITE_COLUMN =
  "mx-auto w-full min-w-0 max-w-[1440px] px-4 sm:px-5";

/**
 * Prose measure. Left edge is the parent’s, which should be SITE_COLUMN.
 * Do not center this in the viewport — the logo, trail, and title share one x.
 */
export const READING_COLUMN = "w-full min-w-0 max-w-[40rem]";

/** Editorial index / magazine page title (not brand dossier H1). */
export const PAGE_TITLE =
  "font-serif text-[1.85rem] font-semibold tracking-tight text-[var(--km-ink)] sm:text-[2.1rem]";
