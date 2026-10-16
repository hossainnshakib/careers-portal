import { spawnSync } from "node:child_process";
import { expect, test } from "../support/admin-fixture";
import { completeAdminMfa } from "../support/mfa-login";
import { demoDisclaimer, demoSlugs } from "../../src/lib/demo";

test.use({ trace: "off" });

function cleanupProbe(write: boolean) {
  return spawnSync(process.execPath, ["--env-file-if-exists=.env.local", "--conditions=react-server", "--import", "tsx", "src/db/seed/validation.ts", "cleanup", ...(write ? ["--write", "--confirm=xmtoccukridshadnxrlc"] : [])], { encoding: "utf8", timeout: 30000 });
}
function syntheticPdf() {
  let text = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const [index, object] of ["<</Type /Catalog /Pages 2 0 R>>", "<</Type /Pages /Kids [3 0 R] /Count 1>>", "<</Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources <<>>>>", "<</Length 0>>\nstream\n\nendstream"].entries()) {
    offsets.push(Buffer.byteLength(text)); text += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(text);
  return Buffer.from(`${text}xref\n0 5\n0000000000 65535 f \n${offsets.map(offset => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<</Size 5 /Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`);
}

test("all five DEMO jobs disclose fictional status and exclude job-posting structured data", async ({ page }) => {
  for (const slug of demoSlugs) {
    await page.goto(`/jobs/${slug}`);
    await expect(page.getByTestId("demo-notice")).toContainText(demoDisclaimer);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
    await page.getByRole("link", { name: "Apply now", exact: true }).first().click();
    await expect(page.getByTestId("demo-notice")).toContainText(demoDisclaimer);
    await expect(page.getByRole("region", { name: "Application form" })).toBeVisible();
  }
});

test("synthetic DEMO applies through all eleven types, preserves consent/files, reviews and deletes safely", async ({ page, adminAccount }) => {
  test.setTimeout(240000);
  const email = `${adminAccount.prefix}demo-candidate@example.com`;
  await page.goto(`/?q=Platform%20Developer&mode=remote`);
  const role = page.getByRole("region", { name: "Open roles", exact: true }).getByRole("link").filter({ hasText: "DEMO — Platform Developer" });
  await expect(role).toHaveCount(1);
  await role.click();
  await page.getByRole("link", { name: "Apply now", exact: true }).first().click();
  await page.getByLabel("Full name", { exact: true }).fill("DEMO Synthetic Candidate — নমুনা");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Phone", { exact: true }).fill("01700000000");
  await page.getByLabel("Location (city/country)", { exact: true }).fill("Synthetic location, Bangladesh");
  await page.getByLabel("LinkedIn profile", { exact: true }).fill("https://example.com/synthetic-profile");
  await page.getByLabel("Portfolio or website", { exact: true }).fill("https://example.com/synthetic-portfolio");
  await page.getByLabel("Years of relevant experience", { exact: true }).fill("3");
  await page.getByLabel("Current or most recent job title and company", { exact: true }).fill("Synthetic role at Example Test Company");
  await page.getByLabel("Earliest date you can join", { exact: true }).fill(new Date().toISOString().slice(0, 10));
  await page.getByLabel("Expected monthly salary (BDT)", { exact: true }).fill("50000");
  await page.getByLabel("Why do you want to work with us?", { exact: true }).fill("Synthetic validation answer — এটি একটি নমুনা, বাস্তব আবেদন নয়।");
  await page.getByRole("group", { name: /^Sample technical focus/ }).getByRole("radio", { name: "Other", exact: true }).check();
  await page.getByLabel("Sample technical focus Other answer", { exact: true }).fill("Synthetic API testing");
  await page.getByLabel("Sample collaboration preference", { exact: true }).selectOption("documentation");
  await page.getByRole("group", { name: /^Sample tools used/ }).getByRole("checkbox", { name: "Testing", exact: true }).check();
  await page.getByLabel("Can you review a synthetic prototype?", { exact: true }).selectOption("yes");
  await page.getByLabel("Synthetic alternative email", { exact: true }).fill("alternative@example.com");
  await page.getByLabel("Synthetic alternative phone", { exact: true }).fill("01700000000");
  await page.getByLabel("Sample weekly availability", { exact: true }).fill("12.5");
  await expect(page.getByRole("button", { name: "Submit application", exact: true })).toBeEnabled({ timeout: 45000 });
  const file = { name: "synthetic-only.pdf", mimeType: "application/pdf", buffer: syntheticPdf() };
  for (const label of ["CV *", "Synthetic work sample *"]) {
    await page.getByLabel(label, { exact: true }).setInputFiles(file);
    await expect(page.getByRole("region", { name: `${label} upload`, exact: true }).getByText("Uploaded", { exact: true })).toBeVisible({ timeout: 30000 });
  }
  await page.getByRole("button", { name: "Submit application", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Consent to the privacy notice is required." })).toBeVisible();
  await page.getByRole("checkbox", { name: /privacy notice and consent/i }).check();
  await page.getByRole("button", { name: "Submit application", exact: true }).click();
  await expect(page).toHaveURL(/\/applied\/APP-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/, { timeout: 60000 });
  const probe = cleanupProbe(true);
  expect(probe.status).toBe(1);
  expect(probe.stdout).toContain('"blocked":true');
  expect(probe.stdout).toContain('"changed":0');
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(adminAccount.email);
  await page.getByLabel("Password", { exact: true }).fill(adminAccount.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeAdminMfa(page, adminAccount);
  await page.goto(`/admin/applications?q=${encodeURIComponent(email)}`);
  await page.getByRole("link", { name: "DEMO Synthetic Candidate — নমুনা", exact: true }).click();
  await expect(page.getByText("Synthetic API testing", { exact: true })).toBeVisible();
  await expect(page.getByText(/Consent/).first()).toBeVisible();
  await page.getByLabel("Application status", { exact: true }).selectOption("shortlisted");
  await page.getByRole("button", { name: "Update status", exact: true }).click();
  await expect(page.getByRole("region", { name: "Status history" })).toContainText("Shortlisted");
  await page.getByLabel("Internal note", { exact: true }).fill("Synthetic validation note only.");
  await page.getByRole("button", { name: "Add note", exact: true }).click();
  await expect(page.getByRole("region", { name: "Internal notes", exact: true })).toContainText("Synthetic validation note only.");
  const [cv] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Download CV", exact: true }).click()]);
  expect(await cv.failure()).toBeNull();
  const [pdf] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Download Profile PDF", exact: true }).click()]);
  const stream = await pdf.createReadStream(); const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).subarray(0, 5).toString()).toBe("%PDF-");
  await page.screenshot({ path: "test-results/demo-review.png", fullPage: true });
  await page.getByRole("button", { name: "Delete application", exact: true }).click();
  await page.getByRole("dialog", { name: "Confirm application deletion" }).getByRole("button", { name: "Confirm deletion", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/applications$/, { timeout: 30000 });
  const after = cleanupProbe(false);
  expect(after.status).toBe(0);
  expect(after.stdout).toContain('"applications":0');
});
