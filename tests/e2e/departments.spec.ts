import { test, expect } from "../support/admin-fixture";
import { completeAdminMfa } from "../support/mfa-login";

// Auth credentials must never be recorded in Playwright trace artifacts.
test.use({ trace: "off" });
test("admin creates, edits, deactivates and reorders a department", async ({
  page,
  adminAccount,
}) => {
  test.setTimeout(90000);
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(adminAccount.email);
  await page.getByLabel("Password", { exact: true }).fill(adminAccount.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeAdminMfa(page, adminAccount);
  await expect(page).toHaveURL(/\/admin$/, { timeout: 30000 });
  await page.getByRole("link", { name: "Departments", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Departments & options", exact: true })).toBeVisible();
  const departments = page.getByRole("region", { name: "Departments", exact: true });
  const name = `${adminAccount.prefix}Design`;
  await departments.getByLabel("Name", { exact: true }).fill(name);
  await departments.getByText("Additional settings", { exact: true }).click();
  await departments.getByLabel("Slug", { exact: true }).fill(`${adminAccount.prefix}design`);
  await departments.getByRole("button", { name: "Add department", exact: true }).click();
  const row = departments.getByRole("row").filter({ hasText: name });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: `Move ${name} up`, exact: true }).click();
  await expect(departments.getByRole("status")).toHaveText("");
  await expect(row.getByRole("button", { name: `Move ${name} down`, exact: true })).toBeEnabled();
  await row.getByRole("button", { name: `Move ${name} down`, exact: true }).click();
  await expect(departments.getByRole("row").last()).toContainText(name);
  await row.getByRole("button", { name: `Edit ${name}`, exact: true }).click();
  await departments.getByLabel("Active", { exact: true }).uncheck();
  await departments.getByLabel("Name", { exact: true }).fill(`${name} updated`);
  await departments.getByRole("button", { name: "Save department", exact: true }).click();
  await expect(row.getByRole("cell", { name: "Inactive", exact: true })).toBeVisible();
  await expect(row).toContainText(`${name} updated`);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
});
