/**
 * Mall / affiliate CTA gate for 「お店で探す」.
 * Default ON (current product). Set either flag to 0/false/off to hide all shop strips.
 *
 * - `NEXT_PUBLIC_SHOP_LINKS_ENABLED` — client UI (required to hide buttons)
 * - `SHOP_LINKS_ENABLED` — server / RSC; client still needs NEXT_PUBLIC_ to hide
 */
export function isShopLinksEnabled(): boolean {
  const publicFlag = process.env.NEXT_PUBLIC_SHOP_LINKS_ENABLED?.trim().toLowerCase();
  const serverFlag = process.env.SHOP_LINKS_ENABLED?.trim().toLowerCase();
  const raw = publicFlag || serverFlag || "";
  if (raw === "0" || raw === "false" || raw === "off" || raw === "no") return false;
  return true;
}
