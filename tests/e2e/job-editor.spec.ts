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
  const basics = page.getByRole("region", { name: "1 · Basics", exact: true });
  await basics.getByText("Additional settings", { exact: true }).click();
  await basics.getByLabel("Experience text", { exact: true }).fill("1 – 4 years");
  await basics.getByLabel("Engagement note", { exact: true }).fill("Six months");
  await basics.getByLabel("Deadline", { exact: true }).fill("2027-02-12");
  await basics.getByLabel("Deadline time", { exact: true }).fill("14:30");
  await basics.getByLabel("Deadline", { exact: true }).fill("2027-02-13");
  await expect(basics.getByLabel("Deadline time", { exact: true })).toHaveValue("14:30");
  await basics.getByLabel("Deadline", { exact: true }).fill("");
  await expect(basics.getByLabel("Deadline time", { exact: true })).toBeDisabled();
  await basics.getByText("Additional settings", { exact: true }).click();
  await page.getByLabel("Summary", { exact: true }).fill("A thoughtful role");
  await page
    .getByLabel("Description (Markdown)", { exact: true })
    .fill("**Meaningful work**\n\n<script>alert(1)</script>");
  await page.getByRole("group", { name: "Description mode", exact: true }).getByRole("button", { name: "Preview", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Description preview", exact: true }).locator("strong"),
  ).toHaveText("Meaningful work");
  await expect(
    page.getByRole("region", { name: "Description preview", exact: true }).locator("script"),
  ).toHaveCount(0);
  await page.getByRole("group", { name: "Description mode", exact: true }).getByRole("button", { name: "Write", exact: true }).click();
  await expect(page.getByLabel("Description (Markdown)", { exact: true })).toHaveValue("**Meaningful work**\n\n<script>alert(1)</script>");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/jobs\/[a-f0-9-]+\/edit$/, { timeout: 30000 });
  await basics.getByText("Additional settings", { exact: true }).click();
  await expect(basics.getByLabel("Experience text", { exact: true })).toHaveValue("1 – 4 years");
  await expect(basics.getByLabel("Engagement note", { exact: true })).toHaveValue("Six months");
  await basics.getByText("Additional settings", { exact: true }).click();
  await page.getByRole("group", { name: /^Work arrangement/ }).getByRole("checkbox", { name: "On-site", exact: true }).check();
  await page.getByRole("group", { name: /^Engagement type/ }).getByRole("checkbox", { name: "Full-time", exact: true }).check();
  await page.getByRole("button", { name: "Publish job", exact: true }).click();
  const publication = page.getByRole("dialog", { name: "Confirm job publication" });
  await expect(publication).toBeVisible();
  await expect(publication).toContainText("Requirements met");
  await publication.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByLabel("Slug", { exact: true })).not.toHaveAttribute("readonly", "");
  await page.getByRole("button", { name: "Publish job", exact: true }).click();
  await publication.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByLabel("Slug", { exact: true })).toHaveAttribute("readonly", "");
  await page.locator('summary[aria-label="More job actions"]').click();
  await page.getByRole("button", { name: "Close job", exact: true }).click();
  // Close/reopen reload the page, which resets the More-actions panel; wait for
  // the reloaded status pill before opening the panel again.
  await expect(page.locator(".admin-pill.admin-pill-closed")).toBeVisible();
  await page.locator('summary[aria-label="More job actions"]').click();
  await expect(page.getByRole("button", { name: "Reopen job", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reopen job", exact: true }).click();
  await expect(page.locator(".admin-pill.admin-pill-open")).toBeVisible();
  await page.locator('summary[aria-label="More job actions"]').click();
  await expect(page.getByRole("button", { name: "Close job", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Duplicate job", exact: true }).click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue(`${title} (copy)`);
  await page.locator('summary[aria-label="More job actions"]').click();
  await page.getByRole("button", { name: "Delete draft", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/jobs$/);
  await page.getByLabel("Search", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Filter jobs", exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: title })).toBeVisible();
});
