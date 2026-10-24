/**
 * One-click share card. On unless an env flag explicitly turns it off.
 *
 * The gate shipped in 0.9.0 because the poster was unfinished. The card now
 * renders with the shared OG fonts, points QR codes at the public library
 * URL, and does not call a third-party image API. Default is on.
 *
 * Turn off with either:
 * - `NEXT_PUBLIC_SHARE_CARD_ENABLED=0` (hides the buttons and the API)
 * - `SHARE_CARD_ENABLED=0` (API / RSC only, when the public flag is unset)
 *
 * The file people download is still the 3:4 poster. The link they share is
 * `/library/[id]`, whose preview is the 1200×630 summary_large_image card.
 */
export function isShareCardEnabled(): boolean {
  const publicFlag = process.env.NEXT_PUBLIC_SHARE_CARD_ENABLED?.trim().toLowerCase();
  const serverFlag = process.env.SHARE_CARD_ENABLED?.trim().toLowerCase();
  const raw = publicFlag || serverFlag || "";
  if (!raw) return true;
  return raw === "1" || raw === "true" || raw === "yes";
}
