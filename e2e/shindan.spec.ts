import { expect, test } from "@playwright/test";
import { riceProfiles } from "../src/data/rice/catalog";
import { runDiagnosis } from "../src/lib/diagnosis/engine";

/**
 * Diagnosis smoke test (spec §7): curry → ゆめぴりか (via the suggestion
 * list) → 粒立ち・さっぱり. The v1 wizard has no cooker question, so the
 * code always ends in ".ih". The expected honmei is computed by running
 * the same pure engine here — never hard-coded, so catalogue revisions
 * do not break this test.
 */
test.describe("TS-SHINDAN diagnosis wizard", () => {
  test("TS-SHINDAN-01 fixed answers reach a three-pick result page", async ({
    page,
  }) => {
    const expected = runDiagnosis(
      {
        dish: "curry",
        baseId: "yumepirika",
        baseIsDefault: false,
        tex: "tsubu",
        cooker: "ih",
      },
      riceProfiles,
    );

    await page.goto("/shindan");
    await expect(
      page.getByRole("heading", { name: "番頭の米診断" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "診断をはじめる" }).click();
    await page.getByRole("button", { name: /カレー/ }).click();

    await page.getByLabel(/ふだん、家で炊いている米は何ですか/).fill("ゆめぴりか");
    // Picking the suggestion is the definitive parse.
    await page.getByRole("button", { name: /ゆめぴりか/ }).click();

    await page.getByRole("button", { name: /粒立ち・さっぱり/ }).click();

    await expect(page).toHaveURL(
      /\/shindan\/r\/v1\.curry\.yumepirika\.tsubu\.ih$/,
      { timeout: 30_000 },
    );
    await expect(
      page.getByRole("heading", { name: "今日の相棒米" }),
    ).toBeVisible();

    for (const slot of ["本命", "対抗", "穴"]) {
      await expect(
        page.getByRole("heading", { name: slot, exact: true }),
      ).toBeVisible();
    }
    // Cards render in slot order: honmei, taikou, ana.
    const honmeiCard = page.locator("article").first();
    await expect(honmeiCard).toContainText(expected.picks[0].rice.name);
    await expect(page.locator("article")).toHaveCount(3);
  });

  test("TS-SHINDAN-02 an invalid code bounces back to the wizard with a notice", async ({
    page,
  }) => {
    await page.goto("/shindan/r/v1.curry.no-such-brand.mochi.ih");
    await expect(page).toHaveURL(/\/shindan\?notice=invalid$/);
    await expect(
      page.getByText("リンクの診断コードを読み取れませんでした"),
    ).toBeVisible();
  });
});
