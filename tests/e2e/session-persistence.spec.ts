import { test, expect } from "../support/admin-fixture";
import { completeAdminMfa } from "../support/mfa-login";

test.use({ trace: "off" });
test("AAL2 persists across context restart/refresh; clear, expiry and sign-out still require full login", async ({ page, browser, adminAccount, baseURL }) => {
  test.setTimeout(180_000);
  await page.goto("/admin/login");
  await page.getByLabel("Email", { exact: true }).fill(adminAccount.email);
  await page.getByLabel("Password", { exact: true }).fill(adminAccount.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await completeAdminMfa(page, adminAccount);
  await page.goto("/admin/login"); await expect(page).toHaveURL(/\/admin\/$|\/admin$/);
  await page.goto("/admin/mfa"); await expect(page).toHaveURL(/\/admin\/$|\/admin$/);
  const state = await page.context().storageState();
  expect(state.cookies.filter(cookie => cookie.name.startsWith("sb-")).every(cookie => cookie.httpOnly && cookie.expires > Date.now() / 1000 + 29 * 86400)).toBe(true);
  await page.context().close();
  const restarted = await browser.newContext({ storageState: state });
  try {
    const again = await restarted.newPage(); await again.goto(`${baseURL}/admin`);
    await expect(again.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
    const refreshedCookies = JSON.parse(await adminAccount.refreshCookies(JSON.stringify(await restarted.cookies())));
    await restarted.clearCookies(); await restarted.addCookies(refreshedCookies);
    await again.goto(`${baseURL}/admin`); await expect(again.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
    const old = await restarted.storageState();
    await again.getByRole("button", { name: "Sign out", exact: true }).click(); await expect(again).toHaveURL(/\/admin\/login$/);
    const replay = await browser.newContext({ storageState: old });
    try { const denied = await replay.newPage(); await denied.goto(`${baseURL}/admin`); await expect(denied).toHaveURL(/\/admin\/login$/); }
    finally { await replay.close(); }
    await restarted.clearCookies(); await again.goto(`${baseURL}/admin`); await expect(again).toHaveURL(/\/admin\/login$/);
    await again.getByLabel("Email", { exact: true }).fill(adminAccount.email); await again.getByLabel("Password", { exact: true }).fill(adminAccount.password);
    await again.getByRole("button", { name: "Sign in", exact: true }).click(); await completeAdminMfa(again, adminAccount);
    await adminAccount.expireSession(JSON.stringify(await restarted.cookies()));
    await again.goto(`${baseURL}/admin`); await expect(again).toHaveURL(/\/admin\/login$/);
  } finally { await restarted.close(); }
});

test("password changes and verified-factor removal invalidate old AAL2 cookies", async ({ page, browser, adminAccount, baseURL }) => {
  test.setTimeout(180_000);
  async function signIn(password: string) {
    await page.goto("/admin/login"); await page.getByLabel("Email", { exact: true }).fill(adminAccount.email); await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click(); await completeAdminMfa(page, adminAccount);
  }
  await signIn(adminAccount.password);
  const beforePassword = await page.context().storageState(); const newPassword = await adminAccount.changePassword();
  const replay = await browser.newContext({ storageState: beforePassword });
  try { const old = await replay.newPage(); await old.goto(`${baseURL}/admin`); await expect(old).toHaveURL(/\/admin\/login$/); } finally { await replay.close(); }
  await page.context().clearCookies(); await signIn(newPassword);
  const beforeFactor = await page.context().storageState(); await adminAccount.removeFactor();
  const factorReplay = await browser.newContext({ storageState: beforeFactor });
  try { const old = await factorReplay.newPage(); await old.goto(`${baseURL}/admin`); await expect(old).toHaveURL(/\/admin\/login$/); } finally { await factorReplay.close(); }
});
