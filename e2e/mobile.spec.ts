import { expect, test } from "@playwright/test";
import { noHorizontalOverflow, waitForHomeReady } from "./helpers";

test.describe("TS-MOBILE", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile project only");

  test("TS-MOBILE-01/02 today card first and no overflow", async ({ page }) => {
    await waitForHomeReady(page);
    await expect(page.locator("#matrix").getByText("今日の一膳", { exact: true }).first()).toBeVisible();
    await noHorizontalOverflow(page);
  });

  test("TS-MOBILE-03 shop strip present under today card", async ({ page }) => {
    await waitForHomeReady(page);
    await expect(page.getByText("取扱オンラインショップ").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^Amazon$/ }).first()).toBeVisible();
  });
});
