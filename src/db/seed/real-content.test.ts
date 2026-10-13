import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { jobInput } from "@/lib/validation/jobs";
import { standardQuestions } from "@/lib/questions/defaults";
import { jobData } from "./data";
import { realJobs, realJobToInput, type ExistingQuestion } from "./real-content";

function contextFor(
  job: (typeof realJobs)[number],
  existingQuestions: ExistingQuestion[] = [],
  locationText: string | null = "Dhaka, Bangladesh",
) {
  const brandIds = job.brands.map(() => randomUUID());
  const optionIds = Object.values(job.options)
    .flat()
    .map(() => randomUUID());
  return {
    jobId: randomUUID(),
    departmentId: randomUUID(),
    brandIds,
    optionIds,
    locationText,
    existingQuestions,
  };
}

describe("real job content package", () => {
  it("covers exactly the 19 final seeded jobs", () => {
    expect(realJobs).toHaveLength(jobData.length);
    const seeded = new Set<string>(jobData.map(([, slug]) => slug));
    for (const job of realJobs) expect(seeded.has(job.slug), `known slug ${job.slug}`).toBe(true);
    expect(new Set(realJobs.map((job) => job.slug)).size).toBe(realJobs.length);
  });

  it("maps every job to a valid admin JobInput", () => {
    for (const job of realJobs) {
      const input = realJobToInput(job, contextFor(job));
      // Round-trip through the admin schema: this is what saveJob enforces.
      expect(() => jobInput.parse(input), `jobInput for ${job.slug}`).not.toThrow();
      expect(input.slug).toBe(job.slug);
      expect(input.title).toBe(job.title);
      expect(input.brandIds).toHaveLength(job.brands.length);
      expect(input.primaryBrandId).toBe(input.brandIds[0]);
      expect(input.optionIds).toHaveLength(
        job.options.arrangement.length + job.options.engagement.length + job.options.experience.length,
      );
      expect(input.intent).toBe("save");
      expect(input.salaryMode).toBe("negotiable");
      expect(input.salaryText).toBe("");
      expect(input.benefits).toEqual([]);
      expect(input.vacancies).toBeNull();
      expect(input.deadlineAt).toBeNull();
    }
  });

  it("adds the seven standard questions when requested", () => {
    for (const job of realJobs) {
      const input = realJobToInput(job, contextFor(job));
      expect(input.questions, `${job.slug}`).toHaveLength(
        standardQuestions.length + job.questions.length,
      );
      const labels = input.questions.slice(0, standardQuestions.length).map((q) => q.label);
      expect(labels).toEqual(standardQuestions.map((q) => q.label));
    }
  });

  it("reuses existing question IDs by label+type and never touches archived ones", () => {
    const job = realJobs[0];
    const first = realJobToInput(job, contextFor(job));
    const existing: ExistingQuestion[] = [
      // Same label+type as the first standard question: must be reused.
      { id: first.questions[0].id, label: first.questions[0].label, type: first.questions[0].type, archivedAt: null },
      // Archived twin of a role question: must NOT be reused (cannot restore).
      {
        id: randomUUID(),
        label: job.questions[0].label,
        type: job.questions[0].type,
        archivedAt: new Date(),
      },
    ];
    const second = realJobToInput(job, contextFor(job, existing));
    expect(second.questions[0].id).toBe(existing[0].id);
    const roleMatch = second.questions.find(
      (q) => q.label === job.questions[0].label && q.type === job.questions[0].type,
    );
    expect(roleMatch?.id).not.toBe(existing[1].id);
    // Question IDs stay unique within the job.
    expect(new Set(second.questions.map((q) => q.id)).size).toBe(second.questions.length);
  });

  it("re-running the mapper keeps every question ID stable", () => {
    const job = realJobs[1];
    const first = realJobToInput(job, contextFor(job));
    const existing: ExistingQuestion[] = first.questions.map((q) => ({
      id: q.id,
      label: q.label,
      type: q.type,
      archivedAt: null,
    }));
    const second = realJobToInput(job, contextFor(job, existing));
    expect(second.questions.map((q) => q.id)).toEqual(first.questions.map((q) => q.id));
  });

  it("falls back to a location line when the job row has none", () => {
    const job = realJobs[0];
    const input = realJobToInput(job, contextFor(job, [], null));
    expect(input.locationText).toBe("Dhaka, Bangladesh");
  });
});
