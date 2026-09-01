import { expect, test } from "@playwright/test";

test.describe("TS-LIBRARY", () => {
  test("TS-LIBRARY-01 library page renders", async ({ page }) => {
    await page.goto("/library");
    await expect(page.getByRole("heading", { name: /銘柄ライブラリ|準備中/ })).toBeVisible();
  });

  test("TS-LIBRARY-02 unified dossier has tasting and encyclopedia", async ({
    page,
  }) => {
    await page.goto("/library/yumepirika");
    // Purchase card also titles the brand; pin the page h1.
    await expect(page.getByRole("heading", { level: 1, name: "ゆめぴりか" })).toBeVisible();
    await expect(page.getByText("侍米師メモ").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "由来と特徴" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "季節と飲み物" })).toBeVisible();
    await expect(page.getByText("季節", { exact: true })).toBeVisible();
    await expect(page.getByText("飲み物", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "炊き方" })).toBeVisible();
  });

  test("TS-LIBRARY-03 legacy /{id} redirects to library", async ({ page }) => {
    const response = await page.goto("/yumepirika");
    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveURL(/\/library\/yumepirika/);
    await expect(page.getByRole("heading", { level: 1, name: "ゆめぴりか" })).toBeVisible();
  });
});
