import { expect, test } from "@playwright/test";

const PAGES = [
  { path: "/privacy", id: "TS-LEGAL-01", needle: /プライバシー/ },
  { path: "/terms", id: "TS-LEGAL-02", needle: /利用規約/ },
  { path: "/tokushoho", id: "TS-LEGAL-03", needle: /特定商取引|特商法|運営/ },
] as const;

for (const pageCase of PAGES) {
  test(`${pageCase.id} ${pageCase.path}`, async ({ page }) => {
    const response = await page.goto(pageCase.path);
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator("body")).toContainText(pageCase.needle);
    await expect(page.getByRole("link", { name: /KomeSomme|味わい|地図|戻/ }).first()).toBeVisible();
  });
}
