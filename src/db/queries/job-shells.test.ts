import { beforeEach, expect, it, vi } from "vitest";
import { departmentData, jobData } from "@/db/seed/data";
import { buildJobShells } from "@/db/seed/shell-values";
import { jobs } from "@/db/schema";
const mocks = vi.hoisted(() => ({ guard: vi.fn(), transaction: vi.fn(), insert: vi.fn(), values: vi.fn(), conflict: vi.fn(), returning: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/maintenance/require-target", () => ({ requireAllowedTarget: mocks.guard }));
vi.mock("@/db", () => ({ getDb: () => ({ transaction: mocks.transaction }) }));
import { seedJobShells } from "./job-shells";

const departments = departmentData.map(([, slug], index) => ({ slug, id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}` }));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.transaction.mockImplementation(async work => work({ select: () => ({ from: async () => departments }), insert: mocks.insert }));
  mocks.insert.mockReturnValue({ values: mocks.values });
  mocks.values.mockReturnValue({ onConflictDoNothing: mocks.conflict });
  mocks.conflict.mockReturnValue({ returning: mocks.returning });
  mocks.returning.mockResolvedValue([]);
});
it("builds the exact final 19 blank unpublished drafts with final department mappings", () => {
  const values = buildJobShells(departments);
  expect(values.map(value => [value.title, value.slug])).toEqual(jobData.map(([title, slug]) => [title, slug]));
  expect(values).toHaveLength(19);
  expect(values.every(value => value.status === "draft" && !value.summary && !value.descriptionMd && !value.responsibilitiesMd && !value.requirementsMd)).toBe(true);
  expect(values[0].departmentId).toBe(departments[0].id);
  expect(values[18].departmentId).toBe(departments[5].id);
});
it("refuses before any transaction when target approval fails", async () => {
  mocks.guard.mockImplementation(() => { throw new Error("Refused"); });
  await expect(seedJobShells()).rejects.toThrow("Refused"); expect(mocks.transaction).not.toHaveBeenCalled();
});
it("preserves every existing slug and touches only the jobs table", async () => {
  expect(await seedJobShells()).toEqual({ created: 0, preserved: 19 });
  expect(mocks.insert).toHaveBeenCalledWith(jobs);
  expect(mocks.conflict).toHaveBeenCalledWith({ target: jobs.slug });
});
it("reports inserted counts and rejects missing departments before inserting", async () => {
  mocks.returning.mockResolvedValue([{ id: "synthetic-one" }]);
  expect(await seedJobShells()).toEqual({ created: 1, preserved: 18 });
  expect(() => buildJobShells(departments.slice(1))).toThrow("departments");
});
