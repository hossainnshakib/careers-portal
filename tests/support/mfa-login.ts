import { expect, type Page } from "@playwright/test";
export async function completeAdminMfa(page: Page, account: { otp: () => Promise<string> }) {
  await expect(page).toHaveURL(/\/admin\/mfa$/, { timeout: 30000 });
  const code = page.getByLabel("Authenticator code", { exact: true });
  const verify = page.getByRole("button", { name: "Verify authenticator", exact: true });
  const otp = await account.otp();
  // A fill that lands before client hydration never reaches React state, and
  // React's value tracker then ignores an identical retry, so clear first.
  const fill = async () => { await code.fill(""); await code.fill(otp); };
  await fill();
  for (let attempt = 0; attempt < 20 && !(await verify.isEnabled()); attempt++) {
    await page.waitForTimeout(1000);
    await fill();
  }
  await expect(verify).toBeEnabled();
  await verify.click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 30000 });
}
