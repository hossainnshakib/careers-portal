import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../support/admin-fixture";
import { completeAdminMfa } from "../support/mfa-login";

test.use({ trace: "off" });

type Box = { x: number; y: number; w: number; h: number };

/** Bounding boxes can differ by a sub-pixel from transform/scale rounding. */
const EPSILON = 0.75;

function assertRow(logos: Box[], container: Box, expected: number, context: string) {
  expect(logos, `${context}: one logo per hiring brand (max three shown)`).toHaveLength(expected);
  for (const logo of logos) {
    expect(logo.h, `${context}: logo height`).toBeGreaterThanOrEqual(22);
    // The row stays inside the card/panel padding.
    expect(logo.x, `${context}: left edge`).toBeGreaterThanOrEqual(container.x - EPSILON);
    expect(logo.y, `${context}: top edge`).toBeGreaterThanOrEqual(container.y - EPSILON);
    expect(logo.x + logo.w, `${context}: right edge`).toBeLessThanOrEqual(container.x + container.w + EPSILON);
    expect(logo.y + logo.h, `${context}: bottom edge`).toBeLessThanOrEqual(container.y + container.h + EPSILON);
  }
  // One line: every logo shares a common vertical band.
  const bandTop = Math.max(...logos.map(logo => logo.y));
  const bandBottom = Math.min(...logos.map(logo => logo.y + logo.h));
  expect(bandBottom - bandTop, `${context}: same vertical band`).toBeGreaterThan(0);
  // No two logos intersect.
  for (let left = 0; left < logos.length; left += 1) {
    for (let right = left + 1; right < logos.length; right += 1) {
      const a = logos[left];
      const b = logos[right];
      const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      expect(overlapX <= EPSILON || overlapY <= EPSILON, `${context}: logos ${left} and ${right} do not intersect`).toBe(true);
    }
  }
}

/** Scroll the row into view and wait for its lazy logos to finish loading. */
async function loadRow(row: Locator) {
  await row.scrollIntoViewIfNeeded();
  await expect.poll(
    () => row.locator("img").evaluateAll(images => images.length === 0 || images.every(image => {
      const img = image as HTMLImageElement;
      return img.complete && img.naturalWidth > 0;
    })),
    { timeout: 15_000 },
  ).toBe(true);
}

async function measure(row: Locator, container: Locator) {
  const [rowData, containerBox] = await Promise.all([
    row.evaluate(element => {
      const rect = element.getBoundingClientRect();
      return {
        wrap: getComputedStyle(element).flexWrap,
        direction: getComputedStyle(element).flexDirection,
        row: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
        logos: Array.from(element.querySelectorAll("img")).map(image => {
          const box = image.getBoundingClientRect();
          return { x: box.x, y: box.y, w: box.width, h: box.height };
        }),
        overflowChips: element.querySelectorAll("span[title]").length,
      };
    }),
    container.evaluate(element => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, w: box.width, h: box.height } satisfies Box;
    }),
  ]);
  return { rowData, containerBox };
}

/**
 * The fixture rows live in the database, but the public catalog is a 300s
 * tagged cache that only `revalidateTag("jobs")` inside a real admin save can
 * refresh (same approach as public-content-stress.spec).
 */
async function revealFixtureJobs(page: Page, fixture: { email: string; password: string; otp: () => Promise<string> }, jobId: string) {
  await page.goto("/admin/login", { timeout: 60_000 });
  await page.getByLabel("Email", { exact: true }).fill(fixture.email);
  await page.getByLabel("Password", { exact: true }).fill(fixture.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await completeAdminMfa(page, fixture);
  await page.goto(`/admin/jobs/${jobId}/edit`, { timeout: 60_000 });
  await expect(page.getByRole("button", { name: "Save changes", exact: true })).toBeEnabled({ timeout: 30_000 });
  const [saved] = await Promise.all([
    page.waitForResponse(response => response.request().method() === "POST" && response.url().includes(`/admin/jobs/${jobId}/edit`)),
    page.waitForEvent("framenavigated", { predicate: frame => frame === page.mainFrame() }),
    page.getByRole("button", { name: "Save changes", exact: true }).click(),
  ]);
  expect(saved.ok()).toBe(true);
  // No UI sign-out here: the editor save is what revalidates the public catalog,
  // and the browser context (plus the fixture account) is discarded afterwards.
}

for (const width of [1440, 390]) {
  test(`brand logo rows stay on one horizontal line at ${width}px`, async ({ page, logoFixture }) => {
    test.setTimeout(300_000);
    const jobs = logoFixture.logos?.jobs ?? [];
    expect(jobs.map(job => job.brandCount)).toEqual([1, 2, 3, 4]);
    await page.setViewportSize({ width, height: 900 });
    await revealFixtureJobs(page, logoFixture, jobs[0].id);

    // Home job cards: one, two, three and four-plus hiring brands.
    await page.goto("/", { timeout: 60_000 });
    for (const job of jobs) {
      const card = page.locator(`ul.ui-job-grid li:has(a[href="/jobs/${job.slug}"]) a`).first();
      await expect(card).toHaveCount(1);
      const row = card.locator('[data-testid="brand-logo-row"]');
      await expect(row).toHaveCount(1);
      await loadRow(row);
      const { rowData, containerBox } = await measure(row, card);
      expect(rowData.wrap, `home card ${job.brandCount}: nowrap`).toBe("nowrap");
      expect(rowData.direction, `home card ${job.brandCount}: row direction`).toBe("row");
      assertRow(rowData.logos, containerBox, Math.min(job.brandCount, 3), `home card ${job.brandCount} brands`);
      // Four or more brands collapse into a "+N" chip instead of a second line.
      expect(rowData.overflowChips, `home card ${job.brandCount}: overflow chip`).toBe(job.brandCount > 3 ? 1 : 0);
    }

    // Job page hero "Hiring for" chips and the "Who you would work with" cards.
    const fourBrand = jobs.find(job => job.brandCount === 4)!;
    await page.goto(`/jobs/${fourBrand.slug}`, { timeout: 60_000 });
    const header = page.locator("main header").first();
    const heroRow = header.locator('[data-testid="brand-logo-row"]');
    await expect(heroRow).toHaveCount(1);
    await loadRow(heroRow);
    const hero = await measure(heroRow, header);
    expect(hero.rowData.wrap, "job hero: nowrap").toBe("nowrap");
    assertRow(hero.rowData.logos, hero.containerBox, 3, "job hero chips");
    expect(hero.rowData.overflowChips, "job hero: overflow chip").toBe(1);

    const section = page.locator("section", { has: page.getByRole("heading", { name: "Who you would work with" }) });
    const cards = section.locator("> div > div");
    await expect(cards).toHaveCount(4);
    for (let index = 0; index < 4; index += 1) {
      const card = cards.nth(index);
      const row = card.locator('[data-testid="brand-logo-row"]');
      await expect(row).toHaveCount(1);
      await loadRow(row);
      const { rowData, containerBox } = await measure(row, card);
      assertRow(rowData.logos, containerBox, 1, `brand card ${index}`);
    }

    // Apply page "Hiring for" chips.
    await page.goto(`/jobs/${fourBrand.slug}/apply`, { timeout: 60_000 });
    const applyHeader = page.locator("main header").first();
    const applyRow = applyHeader.locator('[data-testid="brand-logo-row"]');
    await expect(applyRow).toHaveCount(1);
    await loadRow(applyRow);
    const apply = await measure(applyRow, applyHeader);
    expect(apply.rowData.wrap, "apply hero: nowrap").toBe("nowrap");
    assertRow(apply.rowData.logos, apply.containerBox, 3, "apply hero chips");
    expect(apply.rowData.overflowChips, "apply hero: overflow chip").toBe(1);
  });
}
