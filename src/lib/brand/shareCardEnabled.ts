/**
 * One-click share-card gate. Default OFF so other product surfaces can ship
 * while the poster is still unfinished.
 *
 * Enable with either:
 * - `NEXT_PUBLIC_SHARE_CARD_ENABLED=1` (UI + API; required for client buttons)
 * - `SHARE_CARD_ENABLED=1` (API / RSC only; UI stays hidden without NEXT_PUBLIC_)
 */
export function isShareCardEnabled(): boolean {
  const publicFlag = process.env.NEXT_PUBLIC_SHARE_CARD_ENABLED?.trim().toLowerCase();
  const serverFlag = process.env.SHARE_CARD_ENABLED?.trim().toLowerCase();
  const raw = publicFlag || serverFlag || "";
  return raw === "1" || raw === "true" || raw === "yes";
}
