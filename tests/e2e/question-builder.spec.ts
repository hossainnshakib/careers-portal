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
  const title = `${adminAccount.prefix}Questions — DEMO / TEST ONLY — Not a real job opening`;
  await page.getByLabel("Title", { exact: true }).fill(title);
  await page.getByLabel("Slug", { exact: true }).fill(`${adminAccount.prefix}questions`);
  await page.getByLabel("CV required", { exact: true }).uncheck();
  const builder = page.getByRole("region", { name: "Question builder", exact: true });
  await builder.getByRole("button", { name: "Add question", exact: true }).click();
  const initialDialog = page.getByRole("dialog", { name: "Add question", exact: true });
  await initialDialog.getByLabel("New question label", { exact: true }).fill("Cancelled definition");
  await initialDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(builder.locator(".admin-question")).toHaveCount(0);
  await expect(builder.getByRole("button", { name: "Add question", exact: true })).toBeFocused();
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
    const dialog = page.getByRole("dialog", { name: "Add question", exact: true });
    await dialog.getByLabel("New question type", { exact: true }).selectOption(type);
    await dialog.getByLabel("New question label", { exact: true }).fill(`${type} question`);
    if (type.endsWith("choice")) for (const option of ["Option 1", "Option 2"]) {
      await dialog.getByLabel("Add option", { exact: true }).fill(option);
      await dialog.getByLabel("Add option", { exact: true }).press("Enter");
    }
    await dialog.getByRole("button", { name: "Add question", exact: true }).click();
    await expect(page.getByRole("button", { name: `Edit question ${index + 1}`, exact: true })).toBeVisible();
  }
  await builder.getByRole("button", { name: "Move question 1", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(builder.locator(".admin-question").nth(1)).toContainText("short_text question");
  await page.keyboard.press("ArrowUp");
  await expect(builder.locator(".admin-question").first()).toContainText("short_text question");
  await builder.getByRole("button", { name: "Move question 1", exact: true }).dragTo(builder.locator(".admin-question").nth(1));
  await expect(builder.locator(".admin-question").nth(1)).toContainText("short_text question");
  await builder.getByRole("button", { name: "Move question 2", exact: true }).dragTo(builder.locator(".admin-question").first());
  await expect(builder.locator(".admin-question").first()).toContainText("short_text question");
  for (const number of [3, 4, 6, 11]) await page.getByRole("button", { name: `Edit question ${number}`, exact: true }).click();
  await page.getByLabel("Question 3 allow Other", { exact: true }).check();
  await page.getByLabel("Question 4 allow Other", { exact: true }).check();
  await page.getByLabel("Question 6 integer", { exact: true }).check();
  await page.getByLabel("Question 6 Minimum", { exact: true }).fill("0");
  await page.getByLabel("Question 6 Maximum", { exact: true }).fill("50");
  await page.getByLabel("Question 11 min date", { exact: true }).fill("today");
  await page.getByRole("button", { name: "Add standard questions", exact: true }).click();
  await page.getByRole("button", { name: "Edit question 12", exact: true }).click();
  await page.getByLabel("Question 12 label", { exact: true }).fill("LinkedIn contact");
  const preview = page.getByRole("region", { name: "Candidate form preview", exact: true });
  await expect(preview.getByRole("heading", { name: `Apply for ${title}`, exact: true })).toBeVisible();
  await preview.getByLabel("Preview privacy consent", { exact: true }).check();
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
  await page.getByRole("group", { name: "Question 3 display", exact: true }).getByRole("button", { name: "Dropdown", exact: true }).click();
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
  await preview.getByLabel("Preview privacy consent", { exact: true }).uncheck();
  await preview.getByRole("button", { name: "Validate preview answers", exact: true }).click();
  await expect(preview.getByRole("status")).toContainText("Accept the privacy notice");
  await preview.getByLabel("Preview privacy consent", { exact: true }).check();
  await preview.getByRole("button", { name: "Validate preview answers", exact: true }).click();
  await expect(preview.getByRole("status")).toHaveText("Preview answers are valid.");
  await page.getByRole("group", { name: /^Work arrangement/ }).getByRole("checkbox", { name: "On-site", exact: true }).check();
  await page.getByRole("group", { name: /^Engagement type/ }).getByRole("checkbox", { name: "Full-time", exact: true }).check();
  await page.getByRole("button", { name: "Publish job", exact: true }).click();
  await page.getByRole("dialog", { name: "Confirm job publication" }).getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/jobs\/[a-f0-9-]+\/edit$/, { timeout: 30000 });
  for (const [index, type] of types.entries()) {
    await page.getByRole("button", { name: `Edit question ${index + 1}`, exact: true }).click();
    await expect(page.getByLabel(`Question ${index + 1} type`, { exact: true })).toHaveValue(type);
  }
  await expect(page.getByRole("group", { name: "Question 3 display", exact: true }).getByRole("button", { name: "Dropdown", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Question 11 min date", { exact: true })).toHaveValue("today");
  await page.getByRole("button", { name: "Edit question 12", exact: true }).click();
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
