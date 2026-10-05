import "server-only";

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "@/db";
import {
  adminNotes,
  applicationAnswers,
  applications,
  applicationStatusEvents,
  attachments,
  brands,
  departments,
  jobBrands,
  jobQuestions,
  jobs,
  type JobQuestion,
} from "@/db/schema";
import { uploadDemoFile } from "@/lib/storage/demo-files";
import { ensureBuckets } from "@/lib/storage/ensure-buckets";
import { seedBase } from "./base";
import { jobData } from "./data";
import { requireDevTarget } from "./require-dev";
import { mayUpgradeDemoQuestions } from "./question-upgrade";
import { copyStandardQuestions } from "@/lib/questions/defaults";

function id(label: string) {
  const hex = createHash("sha256").update(`careers-demo:${label}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function reference(i: number) {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  return (
    "APP-" +
    [...createHash("sha256").update(`demo-ref-${i}`).digest().subarray(0, 6)]
      .map((byte) => alphabet[byte % alphabet.length])
      .join("")
  );
}

const departmentsSkills: Record<number, string[]> = {
  1: ["React", "WordPress", "Accessibility"],
  2: ["Figma", "Illustrator", "Typography"],
  3: ["Premiere Pro", "DaVinci Resolve", "After Effects"],
  4: ["Research", "Bengali writing", "SEO"],
  5: ["Campaign strategy", "Analytics", "Community management"],
  6: ["Presentation", "Production planning", "Coordination"],
};

function questionsFor(dept: number, allTypes: boolean) {
  const skills = departmentsSkills[dept];
  const list: Array<
    Pick<JobQuestion, "label" | "type" | "section" | "required" | "config" | "options" | "helpText">
  > = [
    {
      label: "Current professional role",
      type: "short_text",
      section: "professional",
      required: true,
      config: { maxLength: 120 },
      options: null,
      helpText: null,
    },
    {
      label: "Describe a project you are proud of",
      type: "long_text",
      section: "experience",
      required: true,
      config: { maxLength: 3000 },
      options: null,
      helpText: "Explain your contribution and the result.",
    },
    {
      label: "Years of relevant experience",
      type: "number",
      section: "experience",
      required: true,
      config: { min: 0, max: 50, integer: true },
      options: null,
      helpText: null,
    },
    {
      label: "Portfolio URL",
      type: "url",
      section: "portfolio",
      required: false,
      config: null,
      options: null,
      helpText: null,
    },
    {
      label: "Primary skill",
      type: "single_choice",
      section: "skills",
      required: true,
      config: null,
      options: skills.map((label, i) => ({ label, value: `skill_${i}` })),
      helpText: null,
    },
    {
      label: "Tools and skills",
      type: "multiple_choice",
      section: "skills",
      required: false,
      config: { maxSelected: 3 },
      options: skills.map((label, i) => ({ label, value: `skill_${i}` })),
      helpText: null,
    },
  ];
  if (allTypes)
    list.push(
      {
        label: "Available to start within a month?",
        type: "yes_no",
        section: "role_specific",
        required: true,
        config: null,
        options: null,
        helpText: null,
      },
      {
        label: "Alternative email",
        type: "email",
        section: "professional",
        required: false,
        config: null,
        options: null,
        helpText: null,
      },
      {
        label: "Alternative phone",
        type: "phone",
        section: "professional",
        required: false,
        config: null,
        options: null,
        helpText: null,
      },
      {
        label: "Work sample",
        type: "file_upload",
        section: "portfolio",
        required: true,
        config: { accept: ["pdf", "png"], maxSizeMb: 5 },
        options: null,
        helpText: "Upload a small portfolio sample.",
      },
    );
  return list;
}

export function phase1QuestionsFor(dept: number, allTypes: boolean) {
  const roles = questionsFor(dept, allTypes)
    .filter((_, i) => ![0, 2, 3].includes(i))
    .map((q) => ({
      ...q,
      config:
        q.type === "single_choice"
          ? { display: dept % 2 ? "radio" : "dropdown", allowOther: true }
          : q.type === "multiple_choice"
            ? { maxSelected: 3, allowOther: true }
            : q.config,
    }));
  if (!allTypes)
    roles.push({
      label: "Available to collaborate with the team?",
      type: "yes_no",
      section: "role_specific",
      required: false,
      config: null,
      options: null,
      helpText: null,
    });
  return { standards: copyStandardQuestions(), roles };
}

const names = [
  "শাকিব আহমেদ",
  "শ্রীময়ী দত্ত",
  "নন্দিতা চৌধুরী",
  "ঋত্বিক সেন",
  "মোস্তফা রহমান",
  "অঞ্জনা বিশ্বাস",
  "Alex Example",
  "Sam Example",
  "Taylor Example",
  "Jordan Example",
];

function answer(question: JobQuestion, i: number, attachmentId: string) {
  switch (question.type) {
    case "short_text":
      return "Demo professional profile";
    case "long_text":
      return i < 2
        ? "শ্রীময়ীর কর্মক্ষেত্রে যুক্তাক্ষর: ক্ষ ঞ্জ দ্ব স্ত্র ন্ধ। গবেষণা ও সৃজনশীল প্রকল্পে আমার অভিজ্ঞতা রয়েছে।"
        : "Demo project: researched the brief, produced a first draft, gathered feedback, and delivered a clear outcome.";
    case "number":
      return i % 8;
    case "url":
      return "https://example.com/portfolio";
    case "single_choice":
      return "skill_0";
    case "multiple_choice":
      return ["skill_0", "skill_1"];
    case "yes_no":
      return true;
    case "email":
      return `alternative-${i}@example.com`;
    case "phone":
      return "01700000000";
    case "file_upload":
      return [attachmentId];
    case "date":
      return new Date().toISOString().slice(0, 10);
  }
}

export async function seedDemo() {
  requireDevTarget(); // Before any database/storage mutation, including the base seed.
  await ensureBuckets();
  await seedBase();
  const db = getDb();
  const depts = await db.select().from(departments);
  const allBrands = await db.select().from(brands).orderBy(brands.sortOrder);
  for (const [i, [title, slug, deptNumber]] of jobData.entries()) {
    const department = depts.find(
      (item) =>
        item.slug ===
        [
          "web-technical",
          "design-creative",
          "video-motion-production",
          "content-copywriting",
          "marketing-social",
          "presentation-production-operations",
        ][deptNumber - 1],
    )!;
    const status = i < 16 ? "open" : i === 18 ? "closed" : "draft";
    const employmentTypes = [
      "part_time",
      "part_time",
      "part_time",
      "freelance",
      "freelance",
      "internship",
      "contract",
    ] as const;
    await db.transaction(async (tx) => {
      const [job] = await tx
        .insert(jobs)
        .values({
          id: id(slug),
          title,
          slug,
          departmentId: department.id,
          employmentType: employmentTypes[i] ?? "full_time",
          workMode: (["onsite", "remote", "hybrid"] as const)[i % 3],
          experienceLevel:
            slug === "creative-director-production-lead" ? "senior" : i % 2 === 0 ? "entry" : null,
          locationText: "Dhaka, Bangladesh",
          status,
          sortOrder: i + 1,
          publishedAt: status === "draft" ? null : new Date("2026-09-01T00:00:00Z"),
          closedAt: status === "closed" ? new Date("2026-09-20T00:00:00Z") : null,
          summary: `Demo description for ${title}. Work with a small team on thoughtful projects.`,
          descriptionMd: `Demo description for **${title}**.\n\n- Collaborate with a small team\n- Develop practical work\n\n[Example project](https://example.com)\n\n<script>alert('demo HTML must not render')</script>`,
          responsibilitiesMd: "- Understand briefs\n- Deliver careful work\n- Communicate progress",
          requirementsMd:
            "- Relevant skills\n- A portfolio or practical examples\n- Clear communication",
        })
        .onConflictDoNothing({ target: jobs.slug })
        .returning();
      if (!job) {
        const [existing] = await tx.select().from(jobs).where(eq(jobs.slug, slug)).for("update");
        const current = await tx
          .select()
          .from(jobQuestions)
          .where(eq(jobQuestions.jobId, existing.id));
        const baseline = questionsFor(deptNumber, i === 0).map((q, n) => ({
          ...q,
          id: id(`${slug}-q-${n}`),
          sortOrder: n + 1,
        }));
        if (!mayUpgradeDemoQuestions(existing, id(slug), current, baseline)) return;
        // Archive obsolete overlapping questions; snapshots and IDs remain intact.
        for (const n of [0, 2, 3])
          await tx
            .update(jobQuestions)
            .set({ archivedAt: new Date() })
            .where(eq(jobQuestions.id, id(`${slug}-q-${n}`)));
        for (const n of [4, 5])
          await tx
            .update(jobQuestions)
            .set({
              config:
                n === 4
                  ? { display: deptNumber % 2 ? "radio" : "dropdown", allowOther: true }
                  : { maxSelected: 3, allowOther: true },
            })
            .where(eq(jobQuestions.id, id(`${slug}-q-${n}`)));
        const { standards, roles } = phase1QuestionsFor(deptNumber, i === 0);
        await tx
          .insert(jobQuestions)
          .values(
            standards.map((q, n) => ({
              ...q,
              id: id(`${slug}-standard-${n}`),
              jobId: existing.id,
              sortOrder: 20 + n,
            })),
          );
        if (i !== 0)
          await tx
            .insert(jobQuestions)
            .values({
              ...roles.at(-1)!,
              id: id(`${slug}-phase1-role`),
              jobId: existing.id,
              sortOrder: 30,
            });
        return;
      }
      const selectedBrands = [allBrands[i < 16 ? i % 7 : 7]];
      if (i < 3) selectedBrands.push(allBrands[(i + 1) % 7]);
      await tx.insert(jobBrands).values(
        selectedBrands.map((brand, n) => ({
          jobId: job.id,
          brandId: brand.id,
          isPrimary: n === 0,
        })),
      );
      const definitions = phase1QuestionsFor(deptNumber, i === 0);
      await tx.insert(jobQuestions).values(
        [...definitions.standards, ...definitions.roles].map((question, n) => ({
          ...question,
          id: id(`${slug}-q-${n}`),
          jobId: job.id,
          sortOrder: n + 1,
        })),
      );
    });
  }

  // Ordinary React is required by the PDF reconciler. Keep the secret-reading seed
  // under react-server conditions; this credentials-free child only emits a placeholder.
  const pdf = execFileSync(
    process.execPath,
    ["--import", "tsx", fileURLToPath(new URL("./placeholder-pdf.ts", import.meta.url))],
    {
      timeout: 15_000,
      maxBuffer: 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  for (let i = 0; i < 30; i++) {
    const jobSlug = jobData[i % 17 === 16 ? 18 : i % 17][1];
    const [job] = await db.select().from(jobs).where(eq(jobs.slug, jobSlug));
    const applicationId = id(`app-${i}`);
    if (
      (
        await db
          .select({ id: applications.id })
          .from(applications)
          .where(eq(applications.id, applicationId))
      ).length
    )
      continue;
    const links = await db
      .select({ name: brands.name, primary: jobBrands.isPrimary })
      .from(jobBrands)
      .innerJoin(brands, eq(brands.id, jobBrands.brandId))
      .where(eq(jobBrands.jobId, job.id));
    const department = depts.find((item) => item.id === job.departmentId)!;
    const questions = (
      await db.select().from(jobQuestions).where(eq(jobQuestions.jobId, job.id))
    ).filter((question) => !question.archivedAt);
    const fileQuestion = questions.find((item) => item.type === "file_upload");
    const status = (["new", "under_review", "shortlisted", "rejected", "hired"] as const)[i % 5];
    const submittedAt = new Date(Date.UTC(2026, 8, 1 + i));
    const path = `applications/${applicationId}/demo-cv.pdf`;
    await uploadDemoFile(path, pdf, "application/pdf");
    const extraId = id(`extra-${i}`);
    const extraPath = `applications/${applicationId}/demo-sample.pdf`;
    const extra = !!fileQuestion || i % 7 === 0;
    if (extra) await uploadDemoFile(extraPath, pdf, "application/pdf");
    await db.transaction(async (tx) => {
      await tx.insert(applications).values({
        id: applicationId,
        reference: reference(i),
        jobId: job.id,
        fullName: names[i % names.length],
        email: `demo-${i % 22}@example.com`,
        phone: "01700000000",
        location: "Dhaka, Bangladesh",
        status,
        jobTitleSnapshot: job.title,
        jobSlugSnapshot: job.slug,
        departmentNameSnapshot: department.name,
        brandNamesSnapshot: links.map((item) => item.name),
        primaryBrandSnapshot: links.find((item) => item.primary)!.name,
        submittedAt,
        statusChangedAt: submittedAt,
      });
      await tx.insert(attachments).values({
        id: id(`cv-${i}`),
        applicationId,
        kind: "cv",
        storagePath: path,
        fileName: "demo-cv.pdf",
        mimeType: "application/pdf",
        sizeBytes: pdf.length,
      });
      if (extra)
        await tx.insert(attachments).values({
          id: extraId,
          applicationId,
          questionId: fileQuestion?.id ?? null,
          kind: "portfolio",
          storagePath: extraPath,
          fileName: "demo-sample.pdf",
          mimeType: "application/pdf",
          sizeBytes: pdf.length,
        });
      if (questions.length)
        await tx.insert(applicationAnswers).values(
          questions.map((question) => ({
            id: id(`answer-${i}-${question.id}`),
            applicationId,
            questionId: question.id,
            labelSnapshot: question.label,
            typeSnapshot: question.type,
            sectionSnapshot: question.section,
            sortOrder: question.sortOrder,
            value: answer(question, i, extraId),
          })),
        );
      await tx
        .insert(applicationStatusEvents)
        .values({ applicationId, fromStatus: null, toStatus: "new", createdAt: submittedAt });
      if (status !== "new")
        await tx.insert(applicationStatusEvents).values({
          applicationId,
          fromStatus: "new",
          toStatus: status,
          adminUserId: id("demo-admin"),
          createdAt: submittedAt,
        });
      if (i % 4 === 0)
        await tx.insert(adminNotes).values({
          applicationId,
          adminUserId: id("demo-admin"),
          adminEmailSnapshot: "demo-reviewer@example.com",
          note: "Demo internal note: review the portfolio examples.",
          createdAt: submittedAt,
        });
    });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  seedDemo()
    .then(
      () => console.info("Demo seed completed (19 jobs, approximately 30 applications)."),
      () => {
        console.error(
          "Demo seed failed or was refused. Check APP_ENV, the pinned dev project, and connection settings.",
        );
        process.exitCode = 1;
      },
    )
    .finally(closeDb);
