import { expect, type Page } from "@playwright/test";

/** Wait until the home matrix is interactive. Pass `path` to keep query/hash (e.g. `/?brand=`). */
export async function waitForHomeReady(page: Page, path = "/") {
  await page.goto(path);
  await expect(page.locator("#matrix")).toBeVisible({ timeout: 30_000 });
  // Scope to #matrix so the header tagline「侍米師」is not matched.
  await expect(page.locator("#matrix").getByText("いちばん近い一膳", { exact: true }).first()).toBeVisible({
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

/** React range `onChange` listens to `input`. Dragging fires this many times. */
export async function scrubHomeSlider(page: Page, id: "#km-sweetness" | "#km-hardness") {
  await page.locator(id).evaluate((el) => {
    const input = el as HTMLInputElement;
    const min = Number(input.min);
    const max = Number(input.max);
    for (let i = 0; i <= 120; i += 1) {
      input.value = String(min + ((max - min) * i) / 120);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
}

export async function expectHomeAlive(page: Page) {
  await expect(page.getByText("Application error:")).toHaveCount(0);
  await expect(page.locator("#matrix")).toBeVisible();
  await expect(page.locator("#matrix").getByText("いちばん近い一膳", { exact: true }).first()).toBeVisible();
}

/** Fail like Chrome / WebKit if the app mutates history on every slider tick. */
export async function installHistoryQuota(page: Page, limit = 100) {
  await page.addInitScript((max) => {
    let n = 0;
    const origReplace = history.replaceState.bind(history);
    const origPush = history.pushState.bind(history);
    history.replaceState = ((data, unused, url) => {
      n += 1;
      if (n > max) throw new Error("history quota");
      return origReplace(data, unused, url);
    }) as typeof history.replaceState;
    history.pushState = ((data, unused, url) => {
      n += 1;
      if (n > max) throw new Error("history quota");
      return origPush(data, unused, url);
    }) as typeof history.pushState;
  }, limit);
}

export const STABLE_BRAND_ID = "yumepirika";
