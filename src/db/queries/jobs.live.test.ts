import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { closeDb } from "@/db";
import { requireDevTarget } from "@/db/seed/require-dev";
import { listBrands } from "./brands";
import { listDepartments } from "./departments";
import { addTestApplication, removeTestFixture } from "./test-fixtures";
import { loadJob, mutateJob, saveJob, listJobs } from "./jobs";
import { listJobOptions } from "./job-options";
import { jobInput, jobFilters, type JobInput } from "@/lib/validation/jobs";

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
        title: `${prefix}Role`,
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
      await expect(mutateJob(id, "delete")).rejects.toThrow("Only unpublished drafts");
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
      await saveJob({ ...input, questions: [] });
      expect((await loadJob(id))?.questions[0].archivedAt).not.toBeNull();
      await expect(saveJob(input)).rejects.toThrow("Archived questions cannot be restored");
    }, 60000);
  },
);
