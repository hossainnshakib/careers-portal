import { expect, test } from "../support/admin-fixture";
import { freshTestTotp } from "../support/totp";
test.use({ trace: "off" });
test("password-only admins are gated, enroll TOTP, then gain protected access under CSP", async ({ page, mfaAccount }) => {
  test.setTimeout(120000);
  const violations: string[] = [];
  await page.exposeFunction("recordCspViolation", (directive: string) => violations.push(directive));
  await page.addInitScript(() => document.addEventListener("securitypolicyviolation", (event) => {
    void (window as unknown as { recordCspViolation: (directive: string) => Promise<void> }).recordCspViolation(event.effectiveDirective);
  }));
  await page.goto("/admin/login"); await page.getByLabel("Email", { exact: true }).fill(mfaAccount.email); await page.getByLabel("Password", { exact: true }).fill(mfaAccount.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click(); await expect(page).toHaveURL(/\/admin\/mfa$/, { timeout: 30000 });
  const denied = await page.request.get("/api/admin/attachments/00000000-0000-4000-8000-000000000001", { maxRedirects: 0 }); expect(denied.status()).toBe(403);
  await page.goto("/admin/jobs"); await expect(page).toHaveURL(/\/admin\/mfa$/);
  await page.getByRole("button", { name: "Set up authenticator" }).click();
  const key = page.getByTestId("mfa-setup-key"); await expect(key).toBeVisible();
  const secret = (await key.textContent())!;
  await page.getByLabel("Authenticator code", { exact: true }).fill(await freshTestTotp(secret));
  await page.getByRole("button", { name: "Verify authenticator", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 30000 });
  await page.goto("/admin/jobs"); await expect(page.getByRole("heading", { name: "Jobs", exact: true })).toBeVisible();
  expect((await page.context().cookies()).filter((cookie) => cookie.name.startsWith("sb-")).every((cookie) => cookie.httpOnly)).toBe(true);
  expect(violations).toEqual([]);
});
