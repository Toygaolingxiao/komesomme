import { expect, test } from "@playwright/test";

test.describe("TS-LIBRARY", () => {
  test("TS-LIBRARY-01 library page renders", async ({ page }) => {
    await page.goto("/library");
    await expect(page.getByRole("heading", { name: /銘柄ライブラリ|準備中/ })).toBeVisible();
  });

  test("TS-LIBRARY-02 article reuses catalogue tasting, not a second hero", async ({
    page,
  }) => {
    await page.goto("/library/yumepirika");
    await expect(page.getByRole("heading", { name: "ゆめぴりか" })).toBeVisible();
    await expect(page.getByText("米ソムリエの品鑑")).toBeVisible();
    await expect(page.getByRole("link", { name: /品鑑ページで味わいと料理相性/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "由来と背景" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "季節と飲み物との相性" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "美味しく炊くためのコツ" })).toBeVisible();
  });

  test("TS-LIBRARY-03 brand page links to library dossier", async ({ page }) => {
    await page.goto("/yumepirika");
    await expect(page.getByText("銘柄品鑑")).toBeVisible();
    await expect(page.getByRole("heading", { name: "ゆめぴりか" })).toBeVisible();
    await expect(page.getByRole("link", { name: /銘柄ライブラリ/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "季節の相性" })).toHaveCount(0);
  });
});
