import { randomUUID } from "node:crypto";
import { beforeEach, expect, it, vi } from "vitest";
import { brandData, departmentData, optionData } from "@/db/seed/data";
import { validationJobs } from "@/db/seed/validation-content";
import { approvedDemoProject } from "@/db/seed/validation-policy";

const mocks = vi.hoisted(() => ({ guard: vi.fn(), save: vi.fn(), load: vi.fn(), remove: vi.fn(), lock: vi.fn(), transaction: vi.fn(), rows: [] as unknown[][] }));
vi.mock("server-only", () => ({}));
vi.mock("@/db/seed/require-dev", () => ({ requireDevTarget: mocks.guard }));
vi.mock("./jobs", () => ({ saveJob: mocks.save, loadJob: mocks.load }));
vi.mock("@/db", () => {
  const result = () => ({
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolve(mocks.rows.shift() ?? [])),
    for: async () => mocks.rows.shift() ?? [], limit: async () => mocks.rows.shift() ?? [],
  });
  const db = {
    select: () => ({ from: () => ({ ...result(), where: result }) }),
    execute: mocks.lock,
    delete: () => ({ where: mocks.remove }),
    transaction: async (fn: (client: unknown) => unknown) => { mocks.transaction(); return fn(db); },
  };
  return { getDb: () => db };
});
import { runValidationDemo } from "./validation-demo";

const catalog = {
  brands: brandData.map(row => ({ id: randomUUID(), slug: row.slug })),
  departments: departmentData.map(row => ({ id: randomUUID(), slug: row[1] })),
  options: optionData.map(row => ({ id: randomUUID(), slug: row.slug })),
};
const owned = validationJobs(catalog).map(row => ({ ...row, id: randomUUID(), status: "open", updatedAt: new Date() }));
beforeEach(() => {
  vi.clearAllMocks(); mocks.rows = [];
  vi.stubEnv("DEV_SUPABASE_PROJECT_REF", approvedDemoProject);
});
it("does not write during seed dry-run and publishes only five pre-existing drafts", async () => {
  mocks.rows = [[], catalog.brands, catalog.departments, catalog.options];
  expect(await runValidationDemo("seed", false)).toMatchObject({ dryRun: true, created: 5 });
  expect(mocks.save).not.toHaveBeenCalled();
  mocks.rows = [owned.map(row => ({ ...row, status: "draft" })), [], catalog.brands, catalog.departments, catalog.options];
  expect(await runValidationDemo("publish", true)).toMatchObject({ changed: 5 });
  expect(mocks.save).toHaveBeenCalledTimes(5);
  expect(mocks.save.mock.calls.every(([input]) => input.intent === "publish")).toBe(true);
});
it("is a no-op for already published demos, never touching their content", async () => {
  mocks.rows = [owned, [], catalog.brands, catalog.departments, catalog.options];
  expect(await runValidationDemo("seed", true)).toMatchObject({ unchanged: 5, changed: 0, created: 0 });
  expect(mocks.save).not.toHaveBeenCalled();
});
it("refuses prefix-only ownership and a different coherent project before writes", async () => {
  mocks.rows = [[{ ...owned[0], descriptionMd: "Unrelated owner content" }]];
  await expect(runValidationDemo("cleanup", true)).rejects.toThrow("Ownership collision");
  expect(mocks.remove).not.toHaveBeenCalled();
  vi.stubEnv("DEV_SUPABASE_PROJECT_REF", "abcdefghijklmnopqrst");
  await expect(runValidationDemo("seed", true)).rejects.toThrow("owner-authorized");
});
it("reports application counts and refuses the entire cleanup, including synthetic applications", async () => {
  mocks.rows = [owned, [{ jobId: owned[0].id }]];
  expect(await runValidationDemo("cleanup", true)).toMatchObject({ blocked: true, applications: 1, changed: 0 });
  expect(mocks.transaction).not.toHaveBeenCalled();
  expect(mocks.remove).not.toHaveBeenCalled();
});
it("rechecks ownership and applications under the lock immediately before deleting", async () => {
  mocks.rows = [owned, [], owned, [{ id: randomUUID() }]];
  await expect(runValidationDemo("cleanup", true)).rejects.toThrow("Jobs with applications");
  expect(mocks.lock).toHaveBeenCalled();
  expect(mocks.remove).not.toHaveBeenCalled();
  mocks.rows = [owned, [], owned, []];
  expect(await runValidationDemo("cleanup", true)).toMatchObject({ changed: 5 });
  expect(mocks.remove).toHaveBeenCalledTimes(1);
});
it("cleanup dry-run and repeated empty cleanup never delete", async () => {
  mocks.rows = [owned, []];
  expect(await runValidationDemo("cleanup", false)).toMatchObject({ changed: 0 });
  mocks.rows = [[], []];
  expect(await runValidationDemo("cleanup", true)).toMatchObject({ changed: 0 });
  expect(mocks.remove).not.toHaveBeenCalled();
});
