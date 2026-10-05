import { test, expect } from "../support/admin-fixture";

test.use({ trace: "off" });
test("admin edits, hides, reorders and uploads a validated brand logo", async ({
  page,
  adminAccount,
}) => {
  test.setTimeout(90000);
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(adminAccount.email);
  await page.getByLabel("Password", { exact: true }).fill(adminAccount.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 30000 });
  await page.getByRole("link", { name: "Brands", exact: true }).click();
  const name = `${adminAccount.prefix}Brand`;
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel("Slug", { exact: true }).fill(`${adminAccount.prefix}brand`);
  await page.getByLabel("Sector", { exact: true }).selectOption("media");
  await page.getByLabel("Description", { exact: true }).fill("Test brand description");
  await page.getByLabel("Website", { exact: true }).fill("https://example.com");
  await page.getByLabel("Accent color", { exact: true }).fill("#123456");
  await page.getByRole("button", { name: "Save brand", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: name });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: `Move ${name} up`, exact: true }).click();
  await expect(row.getByRole("button", { name: `Move ${name} down`, exact: true })).toBeEnabled();
  await row.getByRole("button", { name: `Move ${name} down`, exact: true }).click();
  await expect(page.getByRole("row").last()).toContainText(name);
  await page
    .getByLabel(`Logo for ${name}`, { exact: true })
    .setInputFiles({
      name: "unsafe.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from('<svg onload="alert(1)"/>'),
    });
  await page.getByRole("button", { name: "Upload logo", exact: true }).click();
  await expect(page.getByRole("main").getByRole("status")).toContainText("Unable to upload logo");
  await page
    .getByLabel(`Logo for ${name}`, { exact: true })
    .setInputFiles({
      name: "logo.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#123456"/></svg>',
      ),
    });
  await page.getByRole("button", { name: "Upload logo", exact: true }).click();
  await expect(row.getByRole("img", { name: `${name} logo`, exact: true })).toBeVisible();
  expect(await row.getByRole("img").evaluate((image) => (image as HTMLImageElement).tagName)).toBe(
    "IMG",
  );
  await page.getByLabel("Status", { exact: true }).selectOption("hidden");
  await page.getByLabel("Description", { exact: true }).fill("Updated brand description");
  await page.getByRole("button", { name: "Save brand", exact: true }).click();
  await expect(row.getByRole("cell", { name: "Hidden", exact: true })).toBeVisible();
});
