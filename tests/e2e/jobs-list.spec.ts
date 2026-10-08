import { test, expect } from "../support/admin-fixture";
import { completeAdminMfa } from "../support/mfa-login";

test.use({ trace: "off" });
test("admin jobs list filters by URL and shows an empty result", async ({ page, adminAccount }) => {
  test.setTimeout(90000);
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(adminAccount.email);
  await page.getByLabel("Password", { exact: true }).fill(adminAccount.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeAdminMfa(page, adminAccount);
  await expect(page).toHaveURL(/\/admin$/, { timeout: 30000 });
  await page.getByRole("link", { name: "Jobs", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Jobs", exact: true })).toBeVisible();
  await page.getByLabel("Status", { exact: true }).selectOption("draft");
  await page.getByLabel("Search", { exact: true }).fill(adminAccount.prefix);
  await page.getByRole("button", { name: "Filter jobs", exact: true }).click();
  await expect(page).toHaveURL(/status=draft/);
  await expect(page.getByText("No jobs match these filters.", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Clear filters", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/jobs$/);
});
