import { expect, test } from "@playwright/test";
import { waitForHomeReady } from "./helpers";

test.describe("TS-CONSULT", () => {
  test("TS-CONSULT-02 example chip fills the query", async ({ page }) => {
    await waitForHomeReady(page);
    await page.getByRole("button", { name: /ハイボールと唐揚げに合う米/ }).first().click();
    await expect(page.locator("#km-query")).toHaveValue("ハイボールと唐揚げに合う米");
  });

  test("TS-CONSULT-01 kill-switch shows safe Japanese message", async ({ page }) => {
    await waitForHomeReady(page);
    await page.locator("#km-query").fill("ハイボールと唐揚げに合う米");
    await page.getByRole("button", { name: /侍米師に相談|もう一度聞く/ }).click();
    await expect(
      page.getByText(/一時停止|味わいの地図から|うまく読み取れませんでした/),
    ).toBeVisible({ timeout: 20_000 });
    // Map shell still present
    await expect(page.locator("#matrix")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("GEMINI_API_KEY");
    await expect(page.locator("body")).not.toContainText("service_role");
  });

  test("TS-CONSULT-01 API returns 503 when disabled", async ({ request }) => {
    const response = await request.post("/api/rice/semantic-recommend", {
      data: { query: "ハイボールと唐揚げに合う米", matchCount: 4 },
    });
    expect(response.status()).toBe(503);
    const body = await response.json();
    expect(String(body.message ?? "")).toMatch(/一時停止/);
  });
});
