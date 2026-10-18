import { expect, test } from "@playwright/test";

// Credential-free packaging/runtime check only. No fixture imports, Auth login,
// account sweep, seed, submit, successful cron invocation or database connection.
test("unconfigured local packaging serves honest public pages without fabricated roles", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByText("The portal is being configured. Please check back soon.", { exact: true })).toBeVisible();
  await expect(page.locator('a[href^="/jobs/"]')).toHaveCount(0);
  expect(response?.headers()["content-security-policy"]).not.toContain("'unsafe-eval'");
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy Policy", exact: true })).toBeVisible();
  await expect(page.locator("main").getByRole("link", { name: "hr@fixenmedia.com", exact: true })).toHaveAttribute("href", "mailto:hr@fixenmedia.com");
  await expect(page.locator("main")).toContainText("submitted applications do not expire automatically");
  await page.goto("/applied/APP-WS2Z7R");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator("main")).not.toContainText(/Demo Candidate|under_review/);
});

test("anonymous admin APIs and cron are denied without any privileged credentials", async ({ page, request }) => {
  await page.goto("/admin/applications");
  await expect(page).toHaveURL(/\/admin\/login$/);
  for (const path of [
    "/api/admin/attachments/00000000-0000-4000-8000-000000000001",
    "/api/admin/applications/00000000-0000-4000-8000-000000000001/pdf",
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(403);
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(await response.json()).toEqual({ error: "Administrator access required." });
  }
  expect((await request.get("/api/cron/daily")).status()).toBe(401);
  expect((await request.get("/api/health")).status()).toBe(200);
});
