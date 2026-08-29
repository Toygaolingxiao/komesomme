import { expect, test } from "@playwright/test";
import { waitForHomeReady } from "./helpers";

test.describe("TS-HOME Desktop map & rail", () => {
  test.skip(({ isMobile }) => !!isMobile, "desktop project only");

  test("TS-HOME-01/03 home matrix and 今日の一膳 render", async ({ page }) => {
    await waitForHomeReady(page);
    await expect(page.locator("#km-sweetness")).toBeVisible();
    await expect(page.locator("#km-hardness")).toBeVisible();
  });

  test("TS-HOME-02 map has plot content", async ({ page }) => {
    await waitForHomeReady(page);
    const map = page.locator("#matrix");
    await expect(map).toBeVisible();
    // Profile nodes or SVG/canvas children should exist once ready
    const nodes = map.locator('[class*="rounded-full"], circle, button').first();
    await expect(nodes).toBeVisible({ timeout: 30_000 });
  });

  test("TS-HOME-05 hardness slider responds without crash", async ({ page }) => {
    await waitForHomeReady(page);
    await page.locator("#km-hardness").fill("5");
    await page.waitForTimeout(400);
    await expect(page.locator("#matrix").getByText("今日の一膳", { exact: true }).first()).toBeVisible();
    await expect(page.locator("#matrix")).toBeVisible();
  });

  test("TS-HOME-04 sweetness slider keeps rail alive", async ({ page }) => {
    await waitForHomeReady(page);
    await page.locator("#km-sweetness").fill("1");
    await page.waitForTimeout(400);
    await page.locator("#km-sweetness").fill("5");
    await page.waitForTimeout(400);
    await expect(page.locator("#matrix").getByText("今日の一膳", { exact: true }).first()).toBeVisible();
  });

  test("TS-HOME-08/10 rail shop strip with PR only", async ({ page }) => {
    await waitForHomeReady(page);
    await expect(page.getByText("取扱オンラインショップ").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^Amazon$/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /楽天/ }).first()).toBeVisible();
    await expect(page.getByText("※PR").first()).toBeVisible();
    await expect(
      page.getByText("Amazonのアソシエイトとして", { exact: false }),
    ).toHaveCount(0);
  });

  test("TS-HOME-09 opening detail from today card", async ({ page }) => {
    await waitForHomeReady(page);
    await page.getByRole("button", { name: /今日の一膳/ }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
  });
});
