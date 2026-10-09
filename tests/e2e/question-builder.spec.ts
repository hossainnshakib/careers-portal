import { test, expect } from "../support/admin-fixture";
import { completeAdminMfa } from "../support/mfa-login";
test.use({ trace: "off" });
test("eleven-type builder validates radio/dropdown Other, dates and candidate preview", async ({
  page,
  adminAccount,
}) => {
  test.setTimeout(180000);
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(adminAccount.email);
  await page.getByLabel("Password", { exact: true }).fill(adminAccount.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeAdminMfa(page, adminAccount);
  await expect(page).toHaveURL(/\/admin$/, { timeout: 30000 });
  await page.goto("/admin/jobs/new");
  await page.getByLabel("Title", { exact: true }).fill(`${adminAccount.prefix}Questions`);
  await page.getByLabel("Slug", { exact: true }).fill(`${adminAccount.prefix}questions`);
  await page.getByLabel("CV required", { exact: true }).uncheck();
  const types = [
    "short_text",
    "long_text",
    "single_choice",
    "multiple_choice",
    "yes_no",
    "number",
    "url",
    "email",
    "phone",
    "file_upload",
    "date",
  ];
  for (const [index, type] of types.entries()) {
    await page.getByRole("button", { name: "Add question", exact: true }).click();
    await page.getByLabel(`Question ${index + 1} label`, { exact: true }).fill(`${type} question`);
    await page.getByLabel(`Question ${index + 1} type`, { exact: true }).selectOption(type);
  }
  await page.getByLabel("Question 3 allow Other", { exact: true }).check();
  await page.getByLabel("Question 4 allow Other", { exact: true }).check();
  await page.getByLabel("Question 6 integer", { exact: true }).check();
  await page.getByLabel("Question 6 Minimum", { exact: true }).fill("0");
  await page.getByLabel("Question 6 Maximum", { exact: true }).fill("50");
  await page.getByLabel("Question 11 min date", { exact: true }).fill("today");
  await page.getByRole("button", { name: "Add standard questions", exact: true }).click();
  await page.getByLabel("Question 12 label", { exact: true }).fill("LinkedIn contact");
  const preview = page.getByRole("region", { name: "Candidate form preview", exact: true });
  await preview.getByLabel("Years of relevant experience", { exact: true }).fill("3");
  await preview
    .getByLabel("Why do you want to work with us?", { exact: true })
    .fill("Thoughtful work with a small team.");
  for (const [name, value] of [
    ["Full name", "শ্রীময়ী দত্ত"],
    ["Email", "preview@example.com"],
    ["Phone", "01712345678"],
    ["Location", "Dhaka"],
  ])
    await preview.getByLabel(`Preview ${name}`, { exact: true }).fill(value);
  await preview.getByLabel("short_text question", { exact: true }).fill("Short answer");
  await preview
    .getByLabel("long_text question", { exact: true })
    .fill("Bengali conjuncts: ক্ষ স্ত্র শ্রী");
  const single = preview.getByRole("group", { name: "single_choice question", exact: true });
  await single.getByLabel("Other", { exact: true }).check();
  await preview.getByRole("button", { name: "Validate preview answers", exact: true }).click();
  await expect(preview.getByRole("status")).toContainText("single_choice question");
  await preview
    .getByLabel("single_choice question Other answer", { exact: true })
    .fill("Independent skill");
  await page.getByLabel("Question 3 display", { exact: true }).selectOption("dropdown");
  await expect(preview.getByLabel("single_choice question", { exact: true })).toBeVisible();
  const multi = preview.getByRole("group", { name: "multiple_choice question", exact: true });
  await multi.getByLabel("Option 1", { exact: true }).check();
  await multi.getByLabel("Other", { exact: true }).check();
  await preview
    .getByLabel("multiple_choice question Other answer", { exact: true })
    .fill("Another skill");
  await preview.getByLabel("yes_no question", { exact: true }).selectOption("no");
  await preview.getByLabel("number question", { exact: true }).fill("0");
  await preview.getByLabel("url question", { exact: true }).fill("https://example.com");
  await preview.getByLabel("email question", { exact: true }).fill("alternative@example.com");
  await preview.getByLabel("phone question", { exact: true }).fill("+8801712345678");
  await preview.getByLabel("file_upload question", { exact: true }).setInputFiles({
    name: "sample.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 preview"),
  });
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  await preview.getByLabel("date question", { exact: true }).fill(yesterday);
  await preview.getByRole("button", { name: "Validate preview answers", exact: true }).click();
  await expect(preview.getByRole("status")).toContainText("Date is outside");
  await preview.getByLabel("date question", { exact: true }).fill(today);
  await preview.getByRole("button", { name: "Validate preview answers", exact: true }).click();
  await expect(preview.getByRole("status")).toHaveText("Preview answers are valid.");
  await page.getByRole("button", { name: "Publish job", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/jobs\/[a-f0-9-]+\/edit$/, { timeout: 30000 });
  for (const [index, type] of types.entries())
    await expect(page.getByLabel(`Question ${index + 1} type`, { exact: true })).toHaveValue(type);
  await expect(page.getByLabel("Question 3 display", { exact: true })).toHaveValue("dropdown");
  await expect(page.getByLabel("Question 11 min date", { exact: true })).toHaveValue("today");
  await expect(page.getByLabel("Question 12 label", { exact: true })).toHaveValue(
    "LinkedIn contact",
  );
  await page.getByRole("link", { name: "Jobs", exact: true }).click();
  await page.getByLabel("Search", { exact: true }).fill(`${adminAccount.prefix}Questions`);
  await page.getByRole("button", { name: "Filter jobs", exact: true }).click();
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: `${adminAccount.prefix}Questions` })
      .getByRole("cell", { name: "Open", exact: true }),
  ).toBeVisible();
});
