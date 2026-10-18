import { expect, test } from "@playwright/test";
import { demoSlugs } from "../../src/lib/demo";

test("empty home, brand deep-link, footer and privacy are truthful without fabricated hiring", async ({ page }) => {
  for (const path of ["/", "/?brand=fixen-media"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "No open roles right now", exact: true })).toBeVisible();
    await expect(page.locator('a[href^="/jobs/"]')).toHaveCount(0);
    await expect(page.getByTestId("demo-notice")).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText(/DEMO|TEST ONLY|Validation only|open regularly|We’re hiring/);
    await expect(page.getByRole("link", { name: "Privacy", exact: true })).toBeVisible();
    await expect(page.locator("footer")).toContainText("Fixen Media");
  }
  await page.screenshot({ path: "test-results/cleanup-public-home.png", fullPage: true });
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy Policy", exact: true })).toBeVisible();
  // Full policy is now owner-approved; manual retention remains honestly disclosed.
  await expect(page.locator("main")).toContainText("submitted applications do not expire automatically");
  await expect(page.locator("main")).not.toContainText(/DEMO|synthetic candidate/i);
});

test("deleted DEMO routes have no active content, form, JobPosting or poster metadata", async ({ page, request }) => {
  for (const slug of demoSlugs) {
    for (const suffix of ["", "/apply"]) {
      const response = await page.goto(`/jobs/${slug}${suffix}`);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole("heading", { name: "This page isn’t available.", exact: true })).toBeVisible();
      await expect(page.locator("main form")).toHaveCount(0);
      await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
      await expect(page.locator("main")).not.toContainText(/Sample BDT|Synthetic work sample|DEMO —/);
      expect(await page.title()).not.toMatch(/DEMO/);
    }
    for (const imagePath of ["opengraph-image", "opengraph-image-1xg06d"]) expect((await request.get(`/jobs/${slug}/${imagePath}`)).status()).toBe(404);
  }
});

test("sitemap, robots and old application reference expose no demo records", async ({ page, request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toMatch(/demo-|\/jobs\/|\/admin|\/applied/);
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain("Disallow: /admin");
  await page.goto("/applied/APP-WS2Z7R");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator("main")).not.toContainText(/Demo Candidate|under_review|Sample City/);
  await page.goto("/admin/applications");
  await expect(page).toHaveURL(/\/admin\/login$/);
});
