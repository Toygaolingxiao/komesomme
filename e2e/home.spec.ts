import { expect, test } from "@playwright/test";
import { expectHomeAlive, installHistoryQuota, scrubHomeSlider, waitForHomeReady } from "./helpers";

test.describe("TS-HOME Desktop map & rail", () => {
  test.skip(({ isMobile }) => !!isMobile, "desktop project only");

  test("TS-HOME-01/03 home matrix and 今日の一膳 render", async ({ page }) => {
    await waitForHomeReady(page);
    await expect(page.locator("#km-sweetness")).toBeVisible();
    await expect(page.locator("#km-hardness")).toBeVisible();
  });

  test("TS-HOME-13 home shows 地図のほか links", async ({ page }) => {
    await waitForHomeReady(page);
    const explore = page.getByRole("navigation", { name: "地図のほか" });
    await expect(explore.getByRole("link", { name: "料理で選ぶ" })).toBeVisible();
    await expect(explore.getByRole("link", { name: "ピックアップ" })).toBeVisible();
    await expect(explore.getByRole("link", { name: "ライブラリ" })).toBeVisible();
  });

  test("TS-HOME-02 map has plot content", async ({ page }) => {
    await waitForHomeReady(page);
    const map = page.locator("#matrix");
    await expect(map).toBeVisible();
    // Profile nodes or SVG/canvas children should exist once ready
    const nodes = map.locator('[class*="rounded-full"], circle, button').first();
    await expect(nodes).toBeVisible({ timeout: 30_000 });
  });

  test("TS-HOME-06/07 rapid slider input does not crash", async ({ page }) => {
    await installHistoryQuota(page);
    await waitForHomeReady(page);
    await scrubHomeSlider(page, "#km-sweetness");
    await scrubHomeSlider(page, "#km-hardness");
    await expectHomeAlive(page);
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

  test("TS-HOME-08/10 shop disclosure expands after discovery", async ({ page }) => {
    await waitForHomeReady(page);
    const shop = page.locator("[data-shop-strip=disclosure]");
    await expect(shop.getByRole("button", { name: /お店で探す/ })).toBeVisible();
    await expect(shop.getByText("※PR")).toBeVisible();
    await expect(shop.getByRole("link", { name: /^Amazon$/ })).toHaveCount(0);

    const neighbours = page.getByText("近い味わいの銘柄");
    await expect(neighbours).toBeVisible();
    const neighbourBox = await neighbours.boundingBox();
    const shopBox = await shop.boundingBox();
    expect(neighbourBox && shopBox && neighbourBox.y < shopBox.y).toBeTruthy();

    await shop.getByRole("button", { name: /お店で探す/ }).click();
    await expect(shop).toHaveAttribute("data-shop-expanded", "true");
    await expect(shop.getByRole("link", { name: /^Amazon$/ })).toBeVisible();
    await expect(shop.getByRole("link", { name: /楽天/ })).toBeVisible();
    await expect(
      page.getByText("Amazonのアソシエイトとして", { exact: false }),
    ).toHaveCount(0);
  });

  test("TS-HOME-09 opening detail from today card", async ({ page }) => {
    await waitForHomeReady(page);
    await page.getByRole("button", { name: /今日の一膳/ }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
  });

  test("TS-HOME-12 slider releases a tapped grain highlight", async ({ page }) => {
    await waitForHomeReady(page);
    const map = page.locator("[data-taste-map=desktop]");
    await map.locator("[aria-current=true]").click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    await page.locator("#km-sweetness").fill("1");
    await page.waitForTimeout(300);
    await page.locator("#km-sweetness").fill("5");
    await page.waitForTimeout(300);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(map.locator("[aria-current=true]")).toHaveCount(1);
  });

  test("TS-HOME-11 shallow brand query opens detail", async ({ page }) => {
    await waitForHomeReady(page, "/?brand=yumepirika");
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /ゆめぴりか/ })).toBeVisible();
  });
});
