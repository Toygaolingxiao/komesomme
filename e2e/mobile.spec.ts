import { expect, test } from "@playwright/test";
import { noHorizontalOverflow, waitForHomeReady } from "./helpers";

test.describe("TS-MOBILE", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile project only");

  test("TS-MOBILE-01/02 today card first and no overflow", async ({ page }) => {
    await waitForHomeReady(page);
    await expect(page.locator("#matrix").getByText("今日の一膳", { exact: true }).first()).toBeVisible();
    await noHorizontalOverflow(page);
  });

  test("TS-MOBILE-03 shop disclosure between map and consult", async ({ page }) => {
    await waitForHomeReady(page);
    const mapPreview = page.locator("[data-taste-map-preview]");
    const shop = page.locator("[data-shop-strip=disclosure]");
    const consult = page.getByRole("heading", { name: "言葉でえらぶ、今日の一膳" });
    await expect(consult).toBeVisible();
    await expect(shop.getByRole("button", { name: /お店で探す/ })).toBeVisible();

    const mapBox = await mapPreview.boundingBox();
    const shopBox = await shop.boundingBox();
    const consultBox = await consult.boundingBox();
    expect(mapBox && shopBox && mapBox.y < shopBox.y).toBeTruthy();
    expect(shopBox && consultBox && shopBox.y < consultBox.y).toBeTruthy();

    await shop.getByRole("button", { name: /お店で探す/ }).click();
    await expect(shop.getByRole("link", { name: /^Amazon$/ })).toBeVisible();
    await expect(shop.getByRole("link", { name: /^メルカリ$/ })).toBeVisible();
  });

  test("TS-MOBILE-04 slider releases a tapped grain highlight", async ({ page }) => {
    await waitForHomeReady(page);
    const map = page.locator("[data-taste-map=preview]");
    await map.locator("[aria-current=true]").click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "閉じる" }).first().click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.locator("#km-sweetness").fill("1");
    await page.waitForTimeout(300);
    await page.locator("#km-sweetness").fill("5");
    await page.waitForTimeout(300);
    await expect(map.locator("[aria-current=true]")).toHaveCount(1);
  });
});
