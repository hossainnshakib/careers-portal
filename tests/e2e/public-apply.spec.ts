import { test, expect } from "../support/admin-fixture";
test.use({ trace: "off" });

test("URL filters render without JavaScript and mobile filters use an accessible bottom sheet", async ({ browser, page, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const serverPage = await context.newPage();
    await serverPage.goto("/?q=no-such-public-role-7b29e8&mode=remote");
    await expect(serverPage.getByRole("heading", { name: "No matching roles" })).toBeVisible();
    await expect(serverPage.getByRole("link", { name: "View role", exact: true })).toHaveCount(0);
  } finally { await context.close(); }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Job filters" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("checkbox", { name: /^remote/ }).check();
  await expect(page).toHaveURL(/mode=remote/);
  await dialog.getByRole("button", { name: "Done filtering" }).click();
  await expect(dialog).not.toBeVisible();
  const robots = await request.get("/robots.txt"); expect(robots.ok()).toBe(true); expect(await robots.text()).toContain("Disallow: /admin");
  const sitemap = await request.get("/sitemap.xml"); expect(sitemap.ok()).toBe(true); expect(await sitemap.text()).toContain("/jobs/");
});

test("browse URL filters, apply with PDF CV and work sample, preserve Bengali and persist snapshots", async ({ page, request, publicFixture }) => {
  test.setTimeout(180000);
  // Save through the actual admin action to invalidate the public catalog cache.
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(publicFixture.email); await page.getByLabel("Password").fill(publicFixture.password);
  await page.getByRole("button", { name: "Sign in" }).click(); await expect(page).toHaveURL(/\/admin$/, { timeout: 30000 });
  await page.goto(`/admin/jobs/${publicFixture.job.id}/edit`);
  const [published] = await Promise.all([
    page.waitForResponse((response) => response.request().method() === "POST" && response.url().includes(`/admin/jobs/${publicFixture.job.id}/edit`)),
    page.getByRole("button", { name: "Save changes", exact: true }).click(),
  ]);
  expect(published.ok()).toBe(true);
  await published.finished();
  await expect(page.getByRole("button", { name: "Save changes", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Sign out" }).click(); await expect(page).toHaveURL(/\/admin\/login/);
  const query = new URLSearchParams({ brand: publicFixture.job.brandSlug, dept: publicFixture.job.departmentSlug, mode: "remote", q: publicFixture.prefix });
  await page.goto(`/?${query}`);
  await expect(page.getByRole("heading", { name: publicFixture.job.title })).toBeVisible();
  await expect(page.getByRole("button", { name: "See all brands" })).toBeVisible();
  await page.getByRole("link", { name: "View role", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/jobs/${publicFixture.job.slug}$`), { timeout: 30000 });
  await page.reload(); // Exercise the JSON-backed detail cache with a non-null deadline.
  let uploadSessionToken = "";
  page.on("response", (response) => {
    if (response.url().endsWith("/api/upload-url") && response.status() === 200) void response.json().then((result) => {
      if (result.data?.sessionToken) {
        uploadSessionToken = result.data.sessionToken;
        const session = JSON.parse(Buffer.from(result.data.sessionToken.split(".")[0], "base64url").toString());
        publicFixture.trackSession(session.id);
      }
    });
  });
  await page.getByRole("link", { name: "Apply for this role" }).click();
  await page.getByLabel("Full name", { exact: true }).fill("শ্রী ক্ষিতিশ");
  await page.getByLabel("Email", { exact: true }).fill("public-fixture@example.com");
  await page.getByLabel("Phone", { exact: true }).fill("01700000000");
  await page.getByLabel("Location (city/country)", { exact: true }).fill("Dhaka, Bangladesh");
  await page.getByLabel("Tell us about your work", { exact: true }).fill("আমি সৃজনশীল কাজে অভিজ্ঞ।");
  await expect(page.getByRole("button", { name: "Submit application" })).toBeEnabled({ timeout: 45000 });
  let document = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of ["<</Type /Catalog /Pages 2 0 R>>", "<</Type /Pages /Kids [3 0 R] /Count 1>>", "<</Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources <<>>>>", "<</Length 0>>\nstream\n\nendstream"].entries()) {
    offsets.push(Buffer.byteLength(document)); document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xref = Buffer.byteLength(document);
  document += `xref\n0 5\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<</Size 5 /Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`;
  const pdf = Buffer.from(document);
  await page.getByLabel("CV *", { exact: true }).setInputFiles({ name: "cv.pdf", mimeType: "application/pdf", buffer: pdf });
  await expect(page.getByRole("region", { name: "CV * upload", exact: true }).getByText("Uploaded", { exact: true })).toBeVisible({ timeout: 30000 });
  await page.getByLabel("Work sample *", { exact: true }).setInputFiles({ name: "sample.pdf", mimeType: "application/pdf", buffer: pdf });
  await expect(page.getByRole("region", { name: "Work sample * upload", exact: true }).getByText("Uploaded", { exact: true })).toBeVisible({ timeout: 30000 });
  // Two completed files plus seven simultaneous reservations: exactly six
  // may succeed. This exercises the real cross-request DB lock and Storage count.
  expect(Boolean(uploadSessionToken)).toBe(true);
  const reservations = await Promise.all(Array.from({ length: 7 }, (_, i) => request.post("/api/upload-url", {
    data: { jobSlug: publicFixture.job.slug, sessionToken: uploadSessionToken, slot: "cv", fileName: `extra-${i}.pdf`, mime: "application/pdf", size: pdf.length },
  })));
  expect(reservations.filter((response) => response.status() === 200)).toHaveLength(6);
  expect(reservations.filter((response) => response.status() === 400)).toHaveLength(1);
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page).toHaveURL(/\/applied\/APP-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/, { timeout: 60000 });
  await expect(page.getByRole("heading", { name: "Application submitted" })).toBeVisible();
  const reference = page.url().split("/").at(-1)!;
  expect(await publicFixture.verify(reference)).toEqual({ applications: 1, answers: 2, attachments: 2, bengaliPreserved: true, snapshotsPresent: true, attachmentAnswersLinked: true, privatePaths: true });
  const replay = await request.post("/api/upload-url", { data: { jobSlug: publicFixture.job.slug, sessionToken: uploadSessionToken, slot: "cv", fileName: "replay.pdf", mime: "application/pdf", size: pdf.length } });
  expect(replay.status()).toBe(400);
});
