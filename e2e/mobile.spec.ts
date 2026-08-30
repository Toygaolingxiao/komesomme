import { expect, test } from "@playwright/test";
import { noHorizontalOverflow, waitForHomeReady } from "./helpers";

test.describe("TS-MOBILE", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile project only");

  test("TS-MOBILE-01/02 today card first and no overflow", async ({ page }) => {
    await waitForHomeReady(page);
    await expect(page.locator("#matrix").getByText("今日の一膳", { exact: true }).first()).toBeVisible();
    await noHorizontalOverflow(page);
  });

  test("TS-MOBILE-03 shop disclosure after consult layer", async ({ page }) => {
    await waitForHomeReady(page);
    const shop = page.locator("[data-shop-strip=disclosure]");
    const consult = page.getByRole("heading", { name: "言葉でえらぶ、今日の一膳" });
    await expect(consult).toBeVisible();
    await expect(shop.getByRole("button", { name: /お店で探す/ })).toBeVisible();

    const consultBox = await consult.boundingBox();
    const shopBox = await shop.boundingBox();
    expect(consultBox && shopBox && consultBox.y < shopBox.y).toBeTruthy();

    await shop.getByRole("button", { name: /お店で探す/ }).click();
    await expect(shop.getByRole("link", { name: /^Amazon$/ })).toBeVisible();
  });
});
