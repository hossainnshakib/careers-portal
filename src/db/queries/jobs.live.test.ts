import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { closeDb, getDb } from "@/db";
import { eq } from "drizzle-orm";
import { applications, jobBrands, jobOptionLinks, jobQuestions } from "@/db/schema";
import { requireDevTarget } from "@/db/seed/require-dev";
import { listBrands } from "./brands";
import { listDepartments } from "./departments";
import { addTestApplication, removeTestFixture } from "./test-fixtures";
import { loadJob, mutateJob, saveJob, listJobs } from "./jobs";
import { listJobOptions } from "./job-options";
import { jobInput, jobFilters, type JobInput } from "@/lib/validation/jobs";
import { demoDisclaimer } from "@/lib/demo";

describe.skipIf(process.env.RUN_SUPABASE_TESTS !== "1")(
  "live job lifecycle transactions (dev only)",
  () => {
    const prefix = `e2e-${randomUUID().replaceAll("-", "")}-`;
    let input: JobInput;
    let id: string;
    const questionId = randomUUID();
    beforeAll(async () => {
      requireDevTarget();
      const [brand] = await listBrands();
      const [department] = await listDepartments();
      if (!brand || !department) throw new Error("Base seed required for lifecycle test");
      const options = await listJobOptions();
      const optionIds = options
        .filter((option) =>
          (option.group === "arrangement" && option.slug === "remote") ||
          (option.group === "engagement" && option.slug === "full_time"),
        )
        .map((option) => option.id);
      if (optionIds.length < 2) throw new Error("Base options required for lifecycle test");
      input = jobInput.parse({
        id: null,
        title: `${prefix}Role — ${demoDisclaimer}`,
        slug: `${prefix}role`,
        departmentId: department.id,
        brandIds: [brand.id],
        primaryBrandId: brand.id,
        optionIds,
        engagementNote: null,
        salaryMode: "negotiable",
        salaryText: "",
        vacancies: null,
        experienceText: null,
        skills: [],
        benefits: [],
        niceToHaveMd: "",
        locationText: "Dhaka",
        deadlineAt: null,
        cvRequired: true,
        summary: "Test summary",
        descriptionMd: "Test description",
        responsibilitiesMd: "Test responsibilities",
        requirementsMd: "Test requirements",
        questions: [
          {
            id: questionId,
            label: "Test question",
            type: "short_text",
            required: true,
            section: "role_specific",
            sortOrder: 0,
          },
        ],
        intent: "save",
      });
      const saved = await saveJob(input);
      id = saved.id;
      input.id = id;
    }, 60000);
    afterAll(async () => {
      try {
        await removeTestFixture(randomUUID(), prefix);
      } finally {
        await closeDb();
      }
    }, 60000);
    it("filters the draft using brand/department/status and literal title search", async () => {
      const rows = await listJobs(
        jobFilters.parse({
          status: "draft",
          department: input.departmentId,
          brand: input.primaryBrandId,
          q: prefix,
        }),
      );
      expect(rows.some((row) => row.id === id)).toBe(true);
      expect((await listJobs(jobFilters.parse({ status: "open", q: prefix }))).length).toBe(0);
    }, 60000);
    it("publishes, enforces immutable slug, closes and reopens without changing first publication", async () => {
      await saveJob({ ...input, intent: "publish" });
      const published = await loadJob(id);
      expect(published?.job.status).toBe("open");
      await expect(saveJob({ ...input, slug: `${prefix}changed` })).rejects.toThrow(
        "Published job slug",
      );
      await mutateJob(id, "close");
      expect((await loadJob(id))?.job.status).toBe("closed");
      await mutateJob(id, "reopen");
      const reopened = await loadJob(id);
      expect(reopened?.job.status).toBe("open");
      expect(reopened?.job.publishedAt?.getTime()).toBe(published?.job.publishedAt?.getTime());
    }, 60000);
    it("deletes a published zero-application job through the real transaction", async () => {
      const copy = await mutateJob(id, "duplicate");
      await saveJob({ ...input, id: copy.id, slug: copy.slug, questions: [], intent: "publish" });
      expect((await loadJob(copy.id))?.job.status).toBe("open");
      await mutateJob(copy.id, "delete");
      expect(await loadJob(copy.id)).toBeNull();
      for (const table of [jobBrands, jobOptionLinks, jobQuestions]) {
        expect(await getDb().select().from(table).where(eq(table.jobId, copy.id))).toEqual([]);
      }
    }, 60000);
    it("rejects a stale expected version without overwriting the current job", async () => {
      const before = await loadJob(id);
      await expect(saveJob(input, new Date(0))).rejects.toThrow("Job changed during preparation");
      expect((await loadJob(id))?.job.updatedAt).toEqual(before?.job.updatedAt);
    }, 60000);
    it("serializes competing deletes so exactly one succeeds", async () => {
      const copy = await mutateJob(id, "duplicate");
      const outcomes = await Promise.allSettled([
        mutateJob(copy.id, "delete"), mutateJob(copy.id, "delete"),
      ]);
      expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
      const refused = outcomes.find((outcome) => outcome.status === "rejected");
      expect(refused?.status === "rejected" && refused.reason.message).toBe("Job not found");
      expect(await loadJob(copy.id)).toBeNull();
    }, 60000);
    it("never orphans a synthetic application racing a job delete", async () => {
      const copy = await mutateJob(id, "duplicate");
      const outcomes = await Promise.allSettled([
        mutateJob(copy.id, "delete"), addTestApplication(copy.id, prefix),
      ]);
      expect(outcomes.filter(outcome => outcome.status === "rejected")).toHaveLength(1);
      const remaining = await loadJob(copy.id);
      const rows = await getDb().select({ id: applications.id }).from(applications).where(eq(applications.jobId, copy.id));
      expect(rows.length).toBe(remaining ? 1 : 0);
      // If the application won, the guarded fixture teardown owns that exact
      // synthetic row; no unrelated application is eligible for its cleanup.
    }, 60000);
    it("duplicates as a fresh draft with independent questions and rejects cross-job IDs atomically", async () => {
      const duplicate = await mutateJob(id, "duplicate");
      const loaded = await loadJob(duplicate.id);
      expect(loaded?.job.status).toBe("draft");
      expect(loaded?.job.publishedAt).toBeNull();
      expect(loaded?.questions[0].id).not.toBe(questionId);
      await expect(saveJob({ ...input, id: duplicate.id, slug: duplicate.slug })).rejects.toThrow(
        "Question belongs to another job",
      );
      expect((await loadJob(duplicate.id))?.questions[0].id).toBe(loaded?.questions[0].id);
      await mutateJob(duplicate.id, "delete");
      expect(await loadJob(duplicate.id)).toBeNull();
    }, 60000);
    it("archives removed questions with applications and forbids their restoration", async () => {
      await addTestApplication(id, prefix);
      await expect(mutateJob(id, "delete")).rejects.toThrow("Jobs with applications cannot be deleted");
      await saveJob({ ...input, questions: [] });
      expect((await loadJob(id))?.questions[0].archivedAt).not.toBeNull();
      await expect(saveJob(input)).rejects.toThrow("Archived questions cannot be restored");
    }, 60000);
  },
);
