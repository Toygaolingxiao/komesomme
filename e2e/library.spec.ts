import { expect, test } from "@playwright/test";

test.describe("TS-LIBRARY", () => {
  test("TS-LIBRARY-01 library page renders", async ({ page }) => {
    await page.goto("/library");
    await expect(page.getByRole("heading", { name: /銘柄ライブラリ|準備中/ })).toBeVisible();
  });
});
