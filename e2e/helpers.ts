import { expect, type Page } from "@playwright/test";

/** Wait until the home matrix is interactive. Pass `path` to keep query/hash (e.g. `/?brand=`). */
export async function waitForHomeReady(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.locator("#matrix")).toBeVisible({ timeout: 30_000 });
  // Scope to #matrix so the header tagline「侍米師」is not matched.
  await expect(page.locator("#matrix").getByText("今日の一膳", { exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
  // Dismiss the once-a-day discover tip so it cannot intercept map/rail clicks in e2e.
  const later = page.getByRole("button", { name: "あとで" });
  if (await later.isVisible().catch(() => false)) {
    await later.click();
  }
}

export async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
}

export const STABLE_BRAND_ID = "yumepirika";
