import { expect, test } from "@playwright/test";

test("invalid synthetic fields have linked errors, first-invalid focus and no action request", async ({ page }) => {
  let actionRequests = 0;
  page.on("request", request => { if (request.headers()["next-action"]) actionRequests++; });
  await page.goto("/jobs/demo-platform-developer/apply");
  await page.getByLabel("Full name", { exact: true }).fill("DEMO Validation Feedback Only");
  await page.getByLabel("Email", { exact: true }).fill("invalid-synthetic-email");
  await page.getByLabel("Phone", { exact: true }).fill("+12025550100");
  await page.getByLabel("Location (city/country)", { exact: true }).fill("Sample City, Bangladesh");
  const submit = page.getByRole("button", { name: "Submit application", exact: true });
  await expect(submit).toBeEnabled({ timeout: 60000 });
  await submit.click();
  const email = page.getByLabel("Email", { exact: true });
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAttribute("aria-describedby", "contact-error-email");
  await expect(page.locator("#contact-error-email")).toHaveText("Enter a valid email address (up to 254 characters).");
  await expect(page.getByLabel("CV *", { exact: true })).toHaveAttribute("aria-invalid", "true");
  const consent = page.getByRole("checkbox", { name: /privacy notice and consent/ });
  await expect(consent).toHaveAttribute("aria-describedby", "consent-error");
  await expect(page.locator("#consent-error")).toHaveText("Consent to the privacy notice is required.");

  await email.fill("validation-feedback@example.com");
  await page.getByLabel("Years of relevant experience", { exact: true }).fill("1.5");
  await page.getByLabel("Earliest date you can join", { exact: true }).fill("2000-01-01");
  await page.getByLabel("Synthetic alternative email", { exact: true }).fill("invalid-optional");
  await consent.check();
  await submit.click();
  // CV precedes dynamic questions in DOM order: focus the visible chooser, not the hidden file input.
  const cv = page.getByRole("region", { name: "CV * upload", exact: true });
  await expect(cv.getByRole("button", { name: "Choose file", exact: true })).toBeFocused();
  await expect(page.locator('[id^="question-error-"]').filter({ hasText: "Enter a valid whole number within the permitted range." })).toHaveCount(1);
  await expect(page.locator('[id^="question-error-"]').filter({ hasText: "Enter a valid date within the permitted range." })).toHaveCount(1);
  await expect(page.getByLabel("Synthetic alternative email", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAttribute("aria-invalid", "false");
  await expect(page.getByLabel("Full name", { exact: true })).toHaveValue("DEMO Validation Feedback Only");
  expect(actionRequests).toBe(0);
  await expect(page).toHaveURL(/\/jobs\/demo-platform-developer\/apply$/);
});
