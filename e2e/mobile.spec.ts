import { expect, test } from "@playwright/test";
import {
  expectHomeAlive,
  installHistoryQuota,
  noHorizontalOverflow,
  scrubHomeSlider,
  visibleRailCaption,
  waitForHomeReady,
} from "./helpers";

test.describe("TS-MOBILE", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile project only");

  test("TS-MOBILE-01/02 today card first and no overflow", async ({ page }) => {
    await waitForHomeReady(page);
    await expect(visibleRailCaption(page)).toBeVisible();
    await noHorizontalOverflow(page);
  });

  test("TS-MOBILE-03 shop disclosure between map and consult", async ({ page }) => {
    await waitForHomeReady(page);
    const mapPreview = page.locator("[data-taste-map-preview]");
    const shop = page.locator("[data-shop-strip=disclosure]").locator("visible=true");
    const consult = page.getByRole("heading", { name: "侍米師に聞く" });
    await expect(consult).toBeVisible();
    await expect(shop.getByRole("button", { name: /お店で探す/ })).toBeVisible();

    const mapBox = await mapPreview.boundingBox();
    const shopBox = await shop.boundingBox();
    const consultBox = await consult.boundingBox();
    expect(mapBox && shopBox && mapBox.y < shopBox.y).toBeTruthy();
    expect(shopBox && consultBox && shopBox.y < consultBox.y).toBeTruthy();

    await shop.getByRole("button", { name: /お店で探す/ }).click();
    await expect(shop.getByRole("link", { name: /^Amazon$/ })).toBeVisible();
    await expect(shop.getByRole("link", { name: /^楽天市場$/ })).toBeVisible();
    await expect(shop.getByRole("link", { name: /^メルカリ$/ })).toBeVisible();
  });

  test("TS-MOBILE-04 first tap highlights, second tap opens, slider drops selection", async ({
    page,
  }) => {
    await waitForHomeReady(page);
    const map = page.locator("[data-taste-map=preview]");
    await map.locator("[aria-current=true]").click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await map.locator("[aria-current=true]").click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("dialog").getByRole("button", { name: "閉じる" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.locator("#km-sweetness").fill("1");
    await page.waitForTimeout(300);
    await page.locator("#km-sweetness").fill("5");
    await page.waitForTimeout(300);
    await expect(map.locator("[aria-current=true]")).toHaveCount(1);
  });

  test("TS-MOBILE-05 rapid slider input does not crash", async ({ page }) => {
    await installHistoryQuota(page);
    await waitForHomeReady(page);
    await scrubHomeSlider(page, "#km-sweetness");
    await scrubHomeSlider(page, "#km-hardness");
    await expectHomeAlive(page);
  });

  test("TS-LIBRARY-07 discover collection thumbs stay compact", async ({ page }) => {
    await page.goto("/discover");
    const collections = page.locator("#collections");
    await expect(collections.getByText("新米のころ")).toBeVisible();
    // Featured row uses the wide figure; assert the list-row thumbs only.
    const img = collections.locator("ul li img").first();
    await expect(img).toBeVisible();
    const box = await img.boundingBox();
    expect(box?.height ?? 999).toBeLessThan(160);
    expect(box?.width ?? 999).toBeLessThan(160);
  });
});
