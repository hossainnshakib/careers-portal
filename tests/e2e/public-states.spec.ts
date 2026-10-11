import { test, expect } from "../support/admin-fixture";

test.use({ trace: "off" });

test("unknown brand and filter URL params are ignored without errors", async ({ page }) => {
  await page.goto("/?brand=nonsense&dept=missing&mode=bogus&level=zzz&q=");
  await expect(page.getByRole("heading", { name: "Good work starts here. Find your place across our brands." })).toBeVisible();
  // No crash banner / error state.
  await expect(page.getByText("We couldn’t load this page.")).toHaveCount(0);
  // Results still render (catalog is nonempty in dev).
  await expect(page.getByRole("region", { name: "Open roles" }).getByRole("heading", { name: "Find your role" })).toBeVisible();
  // Unknown values must not appear as active chips.
  await expect(page.getByRole("button", { name: /Remove Brand filter: nonsense/ })).toHaveCount(0);
});

test("search matching nothing shows a friendly message and Clear filters works", async ({ page }) => {
  await page.goto("/?q=zzz-no-such-role-zzz");
  await expect(page.getByRole("heading", { name: "No roles match your filters" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear filters" })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.getByRole("region", { name: "Open roles" }).getByRole("heading", { name: "Find your role" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No roles match your filters" })).toHaveCount(0);
});

test("unknown application reference returns 404", async ({ page }) => {
  const response = await page.goto("/applied/NOT-A-REF");
  expect(response!.status()).toBe(404);
  await expect(page.getByRole("heading", { name: /This page isn’t available/ })).toBeVisible();
});

test("draft and unknown job slugs return 404", async ({ page }) => {
  const unknown = await page.goto("/jobs/this-role-does-not-exist");
  expect(unknown!.status()).toBe(404);
  const draft = await page.goto("/jobs/draft-only-role");
  expect(draft!.status()).toBe(404);
});

test("open Apply page has a form; unknown Apply slug is 404", async ({ page }) => {
  // Use the stable demo job rather than the ephemeral fixture (avoids fixture setup races).
  await page.goto("/jobs/web-developer/apply");
  await expect(page.getByRole("region", { name: "Application form" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Submit application/ })).toBeVisible();
  const unknown = await page.goto("/jobs/this-role-does-not-exist/apply");
  expect(unknown!.status()).toBe(404);
});
