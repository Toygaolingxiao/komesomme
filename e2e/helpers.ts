import { expect, type Page } from "@playwright/test";

export async function waitForHomeReady(page: Page) {
  await page.goto("/");
  await expect(page.locator("#matrix")).toBeVisible({ timeout: 30_000 });
  // Avoid header subtitle「米ソムリエが選ぶ、今日の一膳」(hidden on mobile).
  await expect(page.locator("#matrix").getByText("今日の一膳", { exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
}

export async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);
}

export const STABLE_BRAND_ID = "yumepirika";
