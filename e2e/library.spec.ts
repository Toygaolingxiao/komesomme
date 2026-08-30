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
    await expect(page.getByRole("link", { name: /品鑑ページで相性/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "由来と背景" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "美味しく炊くためのコツ" })).toBeVisible();
  });

  test("TS-LIBRARY-03 brand page cites cooking from library", async ({ page }) => {
    await page.goto("/yumepirika");
    await expect(page.getByRole("heading", { name: "美味しく炊く" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /由来・特徴・購入の目安をライブラリで読む/ }),
    ).toBeVisible();
  });
});
