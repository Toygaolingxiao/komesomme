import { expect, test } from "@playwright/test";

test.describe("TS-OPS private analytics surface", () => {
  test("TS-OPS-01 /ops is not a public unauthenticated landing", async ({ request }) => {
    // No secret → 404. Secret set (local) → redirect to login, never raw dashboard.
    const response = await request.get("/ops", { maxRedirects: 0 });
    expect([404, 401, 302, 303, 307, 308]).toContain(response.status());
    const yahoo = await request.get("/ops/yahoo", { maxRedirects: 0 });
    expect([404, 401, 302, 303, 307, 308]).toContain(yahoo.status());
    const furusato = await request.get("/ops/yahoo-furusato", { maxRedirects: 0 });
    expect([404, 401, 302, 303, 307, 308]).toContain(furusato.status());
  });

  test("TS-OPS-02 robots disallows /ops", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBeTruthy();
    const text = await response.text();
    expect(text).toMatch(/disallow:\s*\/ops/i);
  });

  test("TS-OPS-03 sitemap omits /ops", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBeTruthy();
    const xml = await response.text();
    expect(xml).not.toMatch(/\/ops</);
  });
});
