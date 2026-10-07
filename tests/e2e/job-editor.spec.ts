import { test, expect } from "../support/admin-fixture";
import { completeAdminMfa } from "../support/mfa-login";
test.use({ trace: "off" });
test("admin authors Markdown, publishes and manages job lifecycle", async ({
  page,
  adminAccount,
}) => {
  test.setTimeout(120000);
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(adminAccount.email);
  await page.getByLabel("Password", { exact: true }).fill(adminAccount.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeAdminMfa(page, adminAccount);
  await expect(page).toHaveURL(/\/admin$/, { timeout: 30000 });
  await page.goto("/admin/jobs/new");
  const title = `${adminAccount.prefix}Role`;
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel("Slug", { exact: true }).fill(`${adminAccount.prefix}role`);
  await page.getByLabel("Summary", { exact: true }).fill("A thoughtful role");
  await page
    .getByLabel("Description (Markdown)", { exact: true })
    .fill("**Meaningful work**\n\n<script>alert(1)</script>");
  await expect(
    page.getByRole("region", { name: "Description preview", exact: true }).locator("strong"),
  ).toHaveText("Meaningful work");
  await expect(
    page.getByRole("region", { name: "Description preview", exact: true }).locator("script"),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/jobs\/[a-f0-9-]+\/edit$/, { timeout: 30000 });
  await page.getByRole("button", { name: "Publish job", exact: true }).click();
  await expect(page.getByLabel("Slug", { exact: true })).toHaveAttribute("readonly", "");
  await page.getByRole("button", { name: "Close job", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reopen job", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reopen job", exact: true }).click();
  await expect(page.getByRole("button", { name: "Close job", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Duplicate job", exact: true }).click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(`${title} (copy)`);
  await page.getByRole("button", { name: "Delete draft", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/jobs$/);
  await page.getByLabel("Search", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Filter jobs", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: title })).toBeVisible();
});
