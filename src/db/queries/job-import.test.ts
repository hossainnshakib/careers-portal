import { beforeEach, expect, it, vi } from "vitest";
import { mapImportJob, parseImport, type ImportCatalog } from "@/lib/jobs/import";
import data from "../../../public/imports/job-04.json";
const mocks = vi.hoisted(() => ({ transaction: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ getDb: () => ({ transaction: mocks.transaction }) }));
import { saveJob } from "./jobs";
import { jobs, jobBrands, jobOptionLinks, jobQuestions } from "@/db/schema";
import { demoDisclaimer, demoMarker } from "@/lib/demo";
const id = (i: number) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const raw = parseImport(JSON.stringify(data)).jobs[0];
const catalog: ImportCatalog = {
  departments: [{ id: id(1), slug: raw.department, isActive: true }],
  brands: raw.brands.map((slug, i) => ({ id: id(i + 10), slug, status: "active" })),
  options: Object.entries(raw.options).flatMap(([group, slugs], i) => slugs.map((slug, j) => ({ id: id(20 + i * 10 + j), slug, group, isActive: true }))), jobs: [],
};
let reads: unknown[][];
let committed: unknown[];
let failQuestions: boolean;
let locked: boolean;
beforeEach(() => {
  mocks.transaction.mockClear();
  committed = []; failQuestions = false; locked = false;
  reads = [[], catalog.departments, catalog.brands, [], catalog.options];
  mocks.transaction.mockImplementation(async (work) => {
    const staged: unknown[] = [];
    const chain = () => {
      const query = { from: () => query, where: () => query, for: () => query, limit: () => query,
        then: (resolve: (rows: unknown[]) => unknown) => { expect(locked).toBe(true); return Promise.resolve(resolve(reads.shift() ?? [])); } };
      return query;
    };
    const result = await work({
      execute: async () => { locked = true; },
      select: chain,
      insert: (table: unknown) => ({ values: async (values: unknown) => {
        if (table === jobQuestions && failQuestions) throw new Error("Question insert failed");
        staged.push({ table, values });
      } }),
      update: (table: unknown) => ({ set: (values: unknown) => ({ where: async () => { staged.push({ table, values }); } }) }),
      delete: () => ({ where: async () => {} }),
    });
    committed.push(...staged);
    return result;
  });
});
it("checks slug/title duplicates inside the shared writer lock, before any record insert", async () => {
  reads[0] = [{ slug: "different", title: ` ${raw.title.toUpperCase()} ` }];
  expect(await saveJob(mapImportJob(raw, catalog), "skip-existing")).toBeNull();
  expect(committed).toEqual([]);
  expect(locked).toBe(true);
});
it("never accepts a client-targeted existing ID for an import", async () => {
  await expect(saveJob({ ...mapImportJob(raw, catalog), id: id(90) }, "skip-existing")).rejects.toThrow("only creates");
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("persists the whole new job graph through one transaction with correct published status", async () => {
  const saved = await saveJob(mapImportJob(raw, catalog), "skip-existing");
  expect(saved?.slug).toBe(raw.slug);
  const inserts = committed as { table: unknown; values: Record<string, unknown> }[];
  expect(inserts.map((row) => row.table)).toEqual([jobs, jobBrands, jobOptionLinks, ...raw.questions.map(() => jobQuestions)]);
  expect(inserts[0].values.status).toBe("open");
  expect(inserts[0].values.publishedAt).toBeInstanceOf(Date);
});
it("rolls back all staged job/brand/option records when question persistence fails", async () => {
  failQuestions = true;
  await expect(saveJob(mapImportJob(raw, catalog), "skip-existing")).rejects.toThrow("Question insert failed");
  expect(committed).toEqual([]);
});
it("rejects references deactivated between preview and persistence without partial records", async () => {
  reads[1] = catalog.departments.map((row) => ({ ...row, isActive: false }));
  await expect(saveJob(mapImportJob(raw, catalog), "skip-existing")).rejects.toThrow("active catalog references");
  expect(committed).toEqual([]);
});
const demoInput = () => ({
  ...mapImportJob(raw, catalog), id: id(90), slug: "demo-platform-developer",
  title: `DEMO — Platform Developer — ${demoDisclaimer}`,
  descriptionMd: `${demoDisclaimer}\n${demoMarker}`, intent: "save" as const,
});
it("preserves main's Date-based guarded demo save and ordinary editing overload", async () => {
  const input = demoInput();
  const updatedAt = new Date("2026-10-19T00:00:00Z");
  const existing = { ...input, updatedAt, status: "draft", publishedAt: null };
  reads = [[existing], catalog.departments, catalog.brands, [], [], [], catalog.options];
  expect((await saveJob(input, updatedAt)).slug).toBe(input.slug);
  expect(committed.length).toBeGreaterThan(0);
  committed = [];
  const ordinary = { ...input, slug: raw.slug, title: raw.title, descriptionMd: raw.descriptionMd };
  reads = [[{ ...existing, ...ordinary }], catalog.departments, catalog.brands, [], [], [], catalog.options];
  expect((await saveJob(ordinary)).slug).toBe(raw.slug);
  expect(committed.length).toBeGreaterThan(0);
});
it.each(["stale", "published", "renamed", "unowned"])("preserves main's under-lock refusal for %s demo updates", async (kind) => {
  const input = demoInput();
  const expected = new Date("2026-10-19T00:00:00Z");
  const existing = {
    ...input, updatedAt: kind === "stale" ? new Date("2026-10-19T00:00:01Z") : expected,
    status: kind === "published" ? "open" : "draft",
    slug: kind === "renamed" ? "demo-visual-designer" : input.slug,
    descriptionMd: kind === "unowned" ? "Not an owned demo" : input.descriptionMd,
  };
  reads = [[existing]];
  await expect(saveJob(input, expected)).rejects.toThrow("Job changed during preparation");
  expect(locked).toBe(true);
  expect(committed).toEqual([]);
});
