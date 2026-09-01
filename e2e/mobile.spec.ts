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
    const shop = page.locator("[data-shop-strip=disclosure]");
    const consult = page.getByRole("heading", { name: "言葉でえらぶ、今日の一膳" });
    const mapHint = page.getByText("色の点は銘柄です。触ると今日の一膳が変わります。", {
      exact: true,
    });
    await expect(consult).toBeVisible();
    await expect(shop.getByRole("button", { name: /お店で探す/ })).toBeVisible();

    const mapBox = await mapHint.boundingBox();
    const shopBox = await shop.boundingBox();
    const consultBox = await consult.boundingBox();
    expect(mapBox && shopBox && mapBox.y < shopBox.y).toBeTruthy();
    expect(shopBox && consultBox && shopBox.y < consultBox.y).toBeTruthy();

    await shop.getByRole("button", { name: /お店で探す/ }).click();
    await expect(shop.getByRole("link", { name: /^Amazon$/ })).toBeVisible();
  });
});
