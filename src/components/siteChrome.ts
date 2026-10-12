/**
 * Shared page columns for SiteHeader, footer, editorial indexes, and reading bodies.
 * Do not invent a second horizontal padding scale for public surfaces.
 */
export const SITE_COLUMN =
  "mx-auto w-full min-w-0 max-w-[1440px] px-4 sm:px-5";

/** Narrow reading column (dossier, legal body). Same px as SITE_COLUMN. */
export const READING_COLUMN =
  "mx-auto w-full min-w-0 max-w-[40rem] px-4 sm:px-5";

/** Editorial index / magazine page title (not brand dossier H1). */
export const PAGE_TITLE =
  "font-serif text-[1.85rem] font-semibold tracking-tight text-[var(--km-ink)] sm:text-[2.1rem]";
