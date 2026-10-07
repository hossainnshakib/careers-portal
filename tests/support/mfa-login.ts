import { expect, type Page } from "@playwright/test";
export async function completeAdminMfa(page: Page, account: { otp: () => Promise<string> }) {
  await expect(page).toHaveURL(/\/admin\/mfa$/, { timeout: 30000 });
  await page.getByLabel("Authenticator code", { exact: true }).fill(await account.otp());
  await page.getByRole("button", { name: "Verify authenticator", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 30000 });
}
