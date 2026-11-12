import { expect, test } from "@playwright/test";
import {
  expectHomeAlive,
  installHistoryQuota,
  scrubHomeSlider,
  visibleRailCaption,
  waitForHomeReady,
} from "./helpers";

test.describe("TS-HOME Desktop map & rail", () => {
  test.skip(({ isMobile }) => !!isMobile, "desktop project only");

  test("TS-HOME-01/03 home matrix and いちばん近い一膳 render", async ({ page }) => {
    await waitForHomeReady(page);
    await expect(page.locator("#km-sweetness")).toBeVisible();
    await expect(page.locator("#km-hardness")).toBeVisible();
  });

  test("TS-HOME-13 primary nav reaches pair, discover, and library", async ({ page }) => {
    await waitForHomeReady(page);
    const explore = page.getByRole("navigation", { name: "主要ナビ" });
    await expect(explore.getByRole("link", { name: "料理で選ぶ" })).toBeVisible();
    await expect(explore.getByRole("button", { name: "ピックアップ" })).toBeVisible();
    await expect(explore.getByRole("link", { name: "ライブラリ" })).toBeVisible();
  });

  test("TS-HOME-02 map has plot content", async ({ page }) => {
    await waitForHomeReady(page);
    const map = page.locator("[data-taste-map=desktop]");
    await expect(map).toBeVisible();
    // Grain buttons on the desktop map (not the lg:hidden mobile today card).
    await expect(map.locator("button").first()).toBeVisible({ timeout: 30_000 });
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
    await expect(visibleRailCaption(page)).toBeVisible();
    await expect(page.locator("#matrix")).toBeVisible();
  });

  test("TS-HOME-04 sweetness slider keeps rail alive", async ({ page }) => {
    await waitForHomeReady(page);
    await page.locator("#km-sweetness").fill("1");
    await page.waitForTimeout(400);
    await page.locator("#km-sweetness").fill("5");
    await page.waitForTimeout(400);
    await expect(visibleRailCaption(page)).toBeVisible();
  });

  test("TS-HOME-08/10 shop strip expands after discovery", async ({ page }) => {
    await waitForHomeReady(page);
    const shop = page.locator("[data-shop-strip=disclosure]").locator("visible=true");
    await expect(shop.getByRole("button", { name: /お店で探す/ })).toBeVisible();
    await expect(shop.getByRole("link", { name: /^Amazon$/ })).toHaveCount(0);

    const neighbours = page
      .getByText("近い味わいの銘柄")
      .filter({ visible: true })
      .first();
    await expect(neighbours).toBeVisible();
    // Layout is still settling while fonts and async strips land, so a
    // one-shot boundingBox comparison flips under load. Poll the geometry
    // until it holds instead of measuring exactly once.
    await expect
      .poll(
        async () => {
          const neighbourBox = await neighbours.boundingBox();
          const shopBox = await shop.boundingBox();
          return Boolean(neighbourBox && shopBox && neighbourBox.y < shopBox.y);
        },
        { timeout: 15_000 },
      )
      .toBe(true);

    await shop.getByRole("button", { name: /お店で探す/ }).click();
    await expect(shop).toHaveAttribute("data-shop-expanded", "true");
    await expect(shop.getByRole("link", { name: /^Amazon$/ })).toBeVisible();
    await expect(shop.getByRole("link", { name: /楽天/ })).toBeVisible();
    await expect(shop.getByRole("link", { name: /^メルカリ$/ })).toBeVisible();
    await expect(
      page.getByText("Amazonのアソシエイトとして", { exact: false }),
    ).toHaveCount(0);
  });

  test("TS-HOME-09 opening detail from today card", async ({ page }) => {
    await waitForHomeReady(page);
    await visibleRailCaption(page).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
  });

  test("TS-HOME-12 slider releases a tapped grain highlight", async ({ page }) => {
    await waitForHomeReady(page);
    const map = page.locator("[data-taste-map=desktop]");
    await map.locator("[aria-current=true]").click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
    await page.locator("#km-sweetness").fill("1");
    await expect(page.locator("#km-sweetness")).toHaveValue("1");
    await page.locator("#km-sweetness").fill("5");
    // No fixed sleeps: these assertions auto-retry, so they observe the
    // release whenever the UI settles instead of racing a 300 ms timer
    // (the old version timed out intermittently under CI load).
    await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 15_000 });
    await expect(map.locator("[aria-current=true]")).toHaveCount(1);
  });

  test("TS-HOME-11 shallow brand query opens detail", async ({ page }) => {
    await waitForHomeReady(page, "/?brand=yumepirika");
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: /ゆめぴりか/ })).toBeVisible();
  });
});
