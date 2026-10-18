import { test, expect } from "../support/admin-fixture";
import { completeAdminMfa } from "../support/mfa-login";
import { readFileSync } from "node:fs";
import type { ImportJob } from "../../src/lib/jobs/import";
const example = JSON.parse(readFileSync(new URL("../../public/imports/job-import-template.json", import.meta.url), "utf8")) as { jobs: ImportJob[] };
test.use({ trace: "off" });

test("admin previews and confirms a multi-job import; duplicates skip and portfolio/dropdown render", async ({ page, adminAccount }) => {
  test.setTimeout(180000);
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(adminAccount.email);
  await page.getByLabel("Password", { exact: true }).fill(adminAccount.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeAdminMfa(page, adminAccount);
  await expect(page).toHaveURL(/\/admin$/, { timeout: 30000 });
  await page.goto("/admin/jobs");
  await page.getByRole("link", { name: "Import jobs", exact: true }).click();
  const title = `${adminAccount.prefix}Imported published role`;
  const slug = `${adminAccount.prefix}imported-published-role`;
  const base = { ...example.jobs[0], title, slug, status: "published", portfolioRequired: true,
    summary: "Synthetic import verification", benefits: ["Practical experience"], skills: ["Design"] };
  const draft = { ...base, title: `${adminAccount.prefix}Imported draft role`, slug: `${adminAccount.prefix}imported-draft-role`, status: "draft" };
  const buffer = Buffer.from(JSON.stringify({ version: 1, jobs: [base, draft] }));
  const upload = () => page.getByLabel("JSON file", { exact: true }).setInputFiles({ name: "synthetic-jobs.json", mimeType: "application/json", buffer });
  await upload();
  await page.getByRole("button", { name: "Validate and preview", exact: true }).click();
  await expect(page.getByText("2 to create; 0 to skip; 0 errors.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirm import", exact: true })).toBeDisabled();
  await page.getByRole("checkbox", { name: /I reviewed this file/ }).check();
  await page.getByRole("button", { name: "Confirm import", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Created (published)." })).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole("status").filter({ hasText: "Created (draft)." })).toBeVisible({ timeout: 60000 });
  await page.getByRole("button", { name: "Validate and preview", exact: true }).click();
  await expect(page.getByText("0 to create; 2 to skip; 0 errors.", { exact: true })).toBeVisible();

  await page.goto(`/jobs/${slug}`);
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
  await expect(page.getByText("Practical experience", { exact: true })).toBeVisible();
  await expect(page.getByText("Design", { exact: true })).toBeVisible();
  await page.goto(`/jobs/${slug}/apply`);
  const choice = page.getByRole("combobox", { name: "Example dropdown — replace before importing", exact: true });
  await expect(choice).toBeVisible();
  await expect(choice.locator("option")).toHaveText(["Choose an option", "First choice", "Second choice"]);
  await expect(page.locator('input[type="radio"]')).toHaveCount(0);
  const portfolio = page.locator("fieldset.question-field").filter({ has: page.getByText("Portfolio or website", { exact: false }) });
  await expect(portfolio.locator("legend")).toContainText("*");
  await expect(portfolio.locator('input[type="url"]')).toBeVisible();
  // Render-only verification: deliberately never submit an application.
  await page.goto(`/jobs/${draft.slug}`);
  await expect(page.getByRole("heading", { name: draft.title, exact: true })).toHaveCount(0);
  await page.goto("/admin/jobs/import");
  await page.getByLabel("JSON file", { exact: true }).setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer: Buffer.from("{") });
  await page.getByRole("button", { name: "Validate and preview", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Invalid JSON");
  await expect(page.getByRole("button", { name: "Confirm import", exact: true })).toHaveCount(0);
});
