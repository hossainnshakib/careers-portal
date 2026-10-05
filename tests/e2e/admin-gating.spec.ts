import { test, expect } from "../support/admin-fixture";
import { protectedPages } from "../../src/lib/auth/surfaces";
test.use({ trace: "off" });
test("every admin page rejects anonymous and authenticated non-admin HTTP requests", async ({
  page,
  outsiderAccount,
}) => {
  test.setTimeout(120000);
  const routes = protectedPages.map((route) =>
    route.replace("[id]", "00000000-0000-4000-8000-000000000001"),
  );
  for (const route of routes) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/admin\/login$/, { timeout: 30000 });
  }
  const cookies = JSON.parse(outsiderAccount.cookieJSON) as { name: string; value: string }[];
  expect(cookies.length > 0).toBe(true);
  await page
    .context()
    .addCookies(cookies.map((cookie) => ({ ...cookie, domain: "localhost", path: "/" })));
  for (const route of routes) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/admin\/login$/, { timeout: 30000 });
  }
  await page.getByLabel("Email", { exact: true }).fill(outsiderAccount.email);
  await page.getByLabel("Password", { exact: true }).fill(outsiderAccount.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Unable to sign in", { timeout: 30000 });
  await expect(page).toHaveURL(/\/admin\/login$/);
});
