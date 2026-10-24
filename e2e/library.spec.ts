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

  test("TS-LIBRARY-04 discover bowl; library has no bowl block", async ({ page }) => {
    await page.goto("/library", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "きょうの三銘柄" })).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: "主要ナビ" }).getByRole("link", { name: "ピックアップ" })
    ).toBeVisible();

    await page.goto("/discover", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "きょうの三銘柄" })).toBeVisible();
    const bowl = page.locator('section[aria-labelledby="todays-bowl-heading"]');
    const links = bowl.locator('a[href^="/library/"]');
    await expect(links).toHaveCount(3);
  });

  test("TS-LIBRARY-05 editorial collection page", async ({ page }) => {
    await page.goto("/discover");
    await expect(
      page.getByRole("navigation", { name: "主要ナビ" }).getByRole("link", { name: "ピックアップ" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "特集" })).toBeVisible();
    await expect(page.locator("#collections")).toBeVisible();

    await page.goto("/collections");
    await expect(page).toHaveURL(/\/discover/);

    await page.goto("/collections/shinmai");
    await expect(page.getByRole("heading", { level: 1, name: "新米のころ" })).toBeVisible();
    await expect(page.locator('a[href="/library/yumepirika"]')).toBeVisible();

    await page.goto("/library/collections/shinmai");
    await expect(page).toHaveURL(/\/collections\/shinmai/);

    const missing = await page.goto("/collections/not-a-real-collection");
    expect(missing?.status()).toBe(404);
  });

  test("TS-LIBRARY-06 dossier shows brand art when available", async ({ page }) => {
    await page.goto("/library/koshihikari-uonuma");
    await expect(
      page.getByRole("heading", { level: 1, name: "コシヒカリ（魚沼産）" })
    ).toBeVisible();
    // next/image may encode the path as ?url=%2Fbrand-art%2F...
    await expect(
      page.locator('img[src*="brand-art"], img[src*="%2Fbrand-art%2F"]').first()
    ).toBeVisible();
  });
});
