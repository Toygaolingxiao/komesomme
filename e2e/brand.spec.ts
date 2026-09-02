import { expect, test } from "@playwright/test";
import { STABLE_BRAND_ID, noHorizontalOverflow } from "./helpers";

test.describe("TS-BRAND / TS-BUY", () => {
  test("TS-BRAND-01 brand dossier renders via library", async ({ page }) => {
    const response = await page.goto(`/library/${STABLE_BRAND_ID}`);
    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1, name: "ゆめぴりか" })).toBeVisible();
    await expect(page.locator("body")).toContainText("北海道");
  });

  test("TS-BRAND-02 / TS-BUY purchase card and disclosures", async ({ page }) => {
    await page.goto(`/library/${STABLE_BRAND_ID}`);
    const purchase = page.locator("#km-purchase");
    await expect(purchase).toBeVisible();
    await expect(purchase.getByRole("tab", { name: "通販" })).toBeVisible();
    await expect(purchase.getByRole("link", { name: /楽天/ })).toBeVisible();
    await expect(purchase.getByRole("link", { name: /Yahoo/ })).toBeVisible();
    await expect(purchase.getByRole("link", { name: /Amazon/ })).toBeVisible();
    await expect(purchase.getByRole("link", { name: /さとふる/ })).toHaveCount(0);
    await purchase.getByRole("tab", { name: "ふるさと納税" }).click();
    await expect(purchase.getByRole("link", { name: /さとふる/ })).toBeVisible();
    await expect(purchase.getByRole("link", { name: /楽天ふるさと|楽天でふるさと納税/ })).toBeVisible();
    await expect(purchase.getByRole("link", { name: /Yahoo!ふるさと|Yahoo!でふるさと納税/ })).toBeVisible();
    await expect(page.locator("#km-purchase")).toHaveCount(1);
    await expect(page.getByText("Amazonのアソシエイトとして").first()).toBeVisible();
    await expect(page.getByText("アフィリエイト広告").first()).toBeVisible();
    await expect(page.getByText("Supported by Rakuten Developers").first()).toBeVisible();
  });

  test("TS-BUY-01..04 href shapes and rel", async ({ page }) => {
    await page.goto(`/library/${STABLE_BRAND_ID}`);
    const purchase = page.locator("#km-purchase");
    const amazon = purchase.getByRole("link", { name: /Amazon/ });
    const rakuten = purchase.getByRole("link", { name: /楽天/ });
    const yahoo = purchase.getByRole("link", { name: /Yahoo/ });

    await expect(amazon).toHaveAttribute("href", /amazon\.co\.jp/);
    await expect(rakuten).toHaveAttribute("href", /rakuten\.co\.jp|hb\.afl\.rakuten/);
    await expect(yahoo).toHaveAttribute("href", /yahoo\.co\.jp|yahoo\.jp\//);

    for (const link of [amazon, rakuten, yahoo]) {
      const rel = (await link.getAttribute("rel")) ?? "";
      expect(rel).toMatch(/noopener/);
      expect(rel).toMatch(/nofollow/);
    }

    await purchase.getByRole("tab", { name: "ふるさと納税" }).click();
    const satofull = purchase.getByRole("link", { name: /さとふる/ });
    await expect(satofull).toHaveAttribute("href", /satofull\.jp/);
    await expect(purchase.getByRole("link", { name: /楽天/ })).toHaveAttribute(
      "href",
      /search\.rakuten\.co\.jp\/search\/mall|hb\.afl\.rakuten/
    );
    await expect(purchase.getByRole("link", { name: /Yahoo/ })).toHaveAttribute(
      "href",
      /shopping\.yahoo\.co\.jp\/search|yahoo\.jp\//
    );
    const satofullRel = (await satofull.getAttribute("rel")) ?? "";
    expect(satofullRel).toMatch(/noopener/);
    expect(satofullRel).toMatch(/nofollow/);
  });

  test("TS-BRAND-04 mobile no horizontal overflow", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile project");
    await page.goto(`/library/${STABLE_BRAND_ID}`);
    await page.waitForLoadState("networkidle");
    await noHorizontalOverflow(page);
  });
});
