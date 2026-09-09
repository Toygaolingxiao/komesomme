import { expect, test } from "@playwright/test";

test.describe("TS-PAIR cuisine landings", () => {
  test("TS-PAIR-01 curry page shows table, PR, and avoid block", async ({ page }) => {
    await page.goto("/pair/curry");
    await expect(page.getByRole("heading", { name: "カレーに合う米" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "今夜の候補" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "比較表" })).toBeVisible();
    await expect(page.getByText("※PR").first()).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "この料理には向かない米" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "お店で価格を見る" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "よくある質問" })).toBeVisible();
  });

  test("TS-PAIR-02 sitemap lists pair routes", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    expect(xml).toContain("/pair/curry");
    expect(xml).toContain("/pair/bento");
    expect(xml).toContain("/pair/donburi");
    expect(xml).toContain("/pair/onigiri");
    expect(xml).toContain("/pair");
  });
});
