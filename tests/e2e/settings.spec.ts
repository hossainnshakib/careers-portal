import { test, expect } from "../support/admin-fixture";
import { completeAdminMfa } from "../support/mfa-login";
test.use({ trace: "off" });
test("both settings URLs retain unsaved editing and guarded delete confirmation", async ({ page, adminAccount }) => {
  test.setTimeout(180000);
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(adminAccount.email);
  await page.getByLabel("Password", { exact: true }).fill(adminAccount.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeAdminMfa(page, adminAccount);
  for (const route of ["departments", "options"]) {
    await page.goto(`/admin/${route}`);
    await expect(page.getByRole("heading", { name: "Departments & options", exact: true })).toBeVisible();
    const departments = page.getByRole("region", { name: "Departments", exact: true });
    await departments.getByLabel("Name", { exact: true }).fill("Unsaved department");
    await departments.getByText("Additional settings", { exact: true }).click();
    await expect(departments.getByLabel("Slug", { exact: true })).toHaveValue("unsaved-department");
    await departments.getByLabel("Slug", { exact: true }).fill("chosen-slug");
    await departments.getByLabel("Name", { exact: true }).fill("Renamed department");
    await expect(departments.getByLabel("Slug", { exact: true })).toHaveValue("chosen-slug");
    const editor = page.getByRole("region", { name: "Option editor", exact: true });
    await editor.getByLabel("Label", { exact: true }).fill("Unsaved option");
    await expect(editor.getByLabel("Slug", { exact: true })).toHaveValue("unsaved-option");
    await editor.getByLabel("Slug", { exact: true }).fill("chosen-option");
    await editor.getByLabel("Label", { exact: true }).fill("Renamed option");
    await editor.getByLabel("Group", { exact: true }).selectOption("experience");
    await expect(editor.getByLabel("Slug", { exact: true })).toHaveValue("chosen-option");
    const work = page.getByRole("region", { name: "Work arrangement", exact: true });
    await work.getByRole("button", { name: "Edit On-site", exact: true }).click();
    await expect(editor.getByLabel("Label", { exact: true })).toHaveValue("On-site");
    await expect(editor.getByLabel("Group", { exact: true })).toBeDisabled();
    await editor.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(editor.getByLabel("Group", { exact: true })).toBeEnabled();
    await expect(editor.getByLabel("Label", { exact: true })).toHaveValue("");
    await expect(work.getByRole("button", { name: "Delete On-site", exact: true })).toBeDisabled();
    // All 13 base options are deliberately used by the demo matrix. Create an
    // owned unused option rather than relying on (or deleting) an owner record.
    // Labels cap at 40 characters; ownership belongs in the full nonce slug.
    const unused = `DEMO ${adminAccount.prefix.slice(4, 12)} ${route}`;
    await editor.getByLabel("Label", { exact: true }).fill(unused);
    await editor.getByLabel("Slug", { exact: true }).fill(`${adminAccount.prefix}unused-${route}`);
    await editor.getByRole("button", { name: "Create", exact: true }).click();
    const removable = page.getByRole("button", { name: `Delete ${unused}`, exact: true });
    await expect(removable).toBeEnabled();
    const rowCount = await page.getByRole("main").getByRole("row").count();
    await removable.click();
    const dialog = page.getByRole("dialog", { name: "Delete option", exact: true });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(removable).toBeFocused();
    await removable.click();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    expect(await page.getByRole("main").getByRole("row").count()).toBe(rowCount);
  }
});
