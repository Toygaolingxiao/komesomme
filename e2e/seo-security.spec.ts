import { expect, test } from "@playwright/test";
import { STABLE_BRAND_ID } from "./helpers";

test("TS-SEO-01 sitemap lists home and library brand", async ({ request }) => {
  const response = await request.get("/sitemap.xml");
  expect(response.ok()).toBeTruthy();
  const xml = await response.text();
  expect(xml).toContain("<url>");
  expect(xml).toMatch(/\/library\/yumepirika/);
});

test("TS-SEO-02 robots points to sitemap and blocks api", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.ok()).toBeTruthy();
  const text = await response.text();
  expect(text.toLowerCase()).toContain("sitemap");
  expect(text).toMatch(/disallow:\s*\/api/i);
});

test("TS-SEC-01 security headers on document", async ({ request }) => {
  const response = await request.get("/");
  expect(response.ok()).toBeTruthy();
  const headers = response.headers();
  expect(headers["x-content-type-options"]?.toLowerCase()).toBe("nosniff");
  expect(headers["x-frame-options"]?.toUpperCase()).toMatch(/SAMEORIGIN|DENY/);
});

test("TS-SEC-02 HTML does not embed service_role", async ({ request }) => {
  const home = await (await request.get("/")).text();
  const brand = await (await request.get(`/library/${STABLE_BRAND_ID}`)).text();
  expect(home).not.toContain("service_role");
  expect(brand).not.toContain("service_role");
});

test("TS-ANALYTICS-01 home survives analytics 500", async ({ page }) => {
  await page.route("**/api/analytics/event", async (route) => {
    await route.fulfill({ status: 500, body: JSON.stringify({ ok: false }) });
  });
  await page.goto("/");
  await expect(page.locator("#matrix")).toBeVisible({ timeout: 30_000 });
  await expect(page.locator("#matrix").getByText("今日の一膳", { exact: true }).first()).toBeVisible({
    timeout: 30_000,
  });
});
