import "server-only";

import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { applicationAnswers, applications, attachments, brands, departments, jobs } from "@/db/schema";
import { requireDevTarget } from "@/db/seed/require-dev";
import { saveJob } from "./jobs";
import { listJobOptions } from "./job-options";
import { jobInput } from "@/lib/validation/jobs";

function guard(prefix: string) { requireDevTarget(); if (!/^e2e-[a-f0-9]{32}-$/.test(prefix)) throw new Error("Invalid public test prefix"); }
export async function createPublicTestJob(prefix: string) {
  guard(prefix);
  const [brand] = await getDb().select().from(brands).where(eq(brands.status, "active")).limit(1);
  const [department] = await getDb().select().from(departments).where(eq(departments.isActive, true)).limit(1);
  if (!brand || !department) throw new Error("Base catalog required for public test");
  const options = await listJobOptions();
  const optionIds = options.filter((option) =>
    (option.group === "arrangement" && option.slug === "remote") ||
    (option.group === "engagement" && option.slug === "full_time") ||
    (option.group === "experience" && option.slug === "entry"),
  ).map((option) => option.id);
  if (optionIds.length < 2) throw new Error("Base options required for public test");
  const questionId = randomUUID(); const textId = randomUUID();
  const saved = await saveJob(jobInput.parse({ id: null, title: `${prefix}Public Application Test`, slug: `${prefix}public`, departmentId: department.id,
    brandIds: [brand.id], primaryBrandId: brand.id, optionIds, engagementNote: null,
    salaryMode: "negotiable", salaryText: "", vacancies: null, experienceText: null,
    skills: [], benefits: [], niceToHaveMd: "", locationText: "Dhaka",
    deadlineAt: new Date(Date.now() + 7 * 86400000).toISOString(), cvRequired: true, summary: "An ephemeral public application test role.", descriptionMd: "Work on meaningful projects.", responsibilitiesMd: "- Build carefully", requirementsMd: "- Relevant experience", intent: "publish",
    questions: [
      { id: textId, label: "Tell us about your work", type: "long_text", required: true, helpText: null, options: null, config: { maxLength: 1500 }, section: "professional", sortOrder: 0 },
      { id: questionId, label: "Work sample", type: "file_upload", required: true, helpText: "Upload a PDF sample.", options: null, config: { accept: ["pdf"], maxSizeMb: 1 }, section: "portfolio", sortOrder: 1 },
    ] }));
  return { ...saved, questionId, textId, brandSlug: brand.slug, brandId: brand.id, departmentId: department.id, departmentSlug: department.slug, title: `${prefix}Public Application Test` };
}
/**
 * Item 6 content stress: one long/all-sections job (near-limit fields, four
 * hiring brands, 20 skills, 12 benefits, an 80-character salary line) and one
 * Bengali job with no optional sections. Used by public-content-stress.spec.
 */
export async function createStressTestJobs(prefix: string) {
  guard(prefix);
  const brandRows = await getDb().select().from(brands).where(eq(brands.status, "active")).orderBy(asc(brands.sortOrder)).limit(4);
  const [department] = await getDb().select().from(departments).where(eq(departments.isActive, true)).orderBy(asc(departments.sortOrder)).limit(1);
  if (brandRows.length < 4 || !department) throw new Error("Base catalog required for stress test");
  const options = await listJobOptions();
  const longOptionIds = options.filter((option) =>
    (option.group === "arrangement" && ["hybrid", "remote"].includes(option.slug)) ||
    (option.group === "engagement" && ["contract", "full_time"].includes(option.slug)) ||
    (option.group === "experience" && ["entry", "senior"].includes(option.slug)),
  ).map((option) => option.id);
  const bengaliOptionIds = options.filter((option) =>
    (option.group === "arrangement" && option.slug === "onsite") ||
    (option.group === "engagement" && option.slug === "part_time") ||
    (option.group === "experience" && option.slug === "fresher-welcome"),
  ).map((option) => option.id);
  if (longOptionIds.length < 2 || bengaliOptionIds.length < 3) throw new Error("Base options required for stress test");
  const longTitle = "Senior Principal Full-Stack Engineer and Platform Reliability Lead for Cross-Brand Hiring Systems, Design Systems and Candidate Experience (Dhaka, Bangladesh, Remote-Friendly, Multiple Brands)";
  const longSummary = "Lead the shared hiring platform every brand relies on: architecture, design system, accessibility and candidate experience for a fast-growing multi-brand catalog.";
  const longSalaryText = "৳ 180,000-260,000 per month plus transport, festival bonus and wellbeing (gross)";
  const longSkills = [
    "TypeScript", "React and Next.js", "PostgreSQL and Drizzle", "cross-brand-design-system-governance",
    "Accessibility audits to WCAG 2.2 AA", "Playwright end-to-end testing", "observability-and-slo-engineering",
    "Design tokens and theming", "Core Web Vitals performance", "performancebudgetingprofiling",
    "Node.js server architecture", "REST and JSON API design", "Cloudflare Turnstile integration",
    "PDF rendering with React", "Supabase and Postgres security", "internationalizationandlocalization",
    "Technical writing and mentoring", "Hiring domain knowledge", "CI with GitHub Actions", "incident-response-runbooks",
  ];
  const longBenefits = [
    "Health cover for you and your family", "Wellness and gym membership allowance",
    "Annual learning budget of BDT 100,000", "Conference and training tickets each year",
    "Festival bonus twice a year", "Transport allowance or remote stipend",
    "Yearly retreat with the whole team", "Modern laptop and the peripherals you need",
    "Flexible hours with core collaboration time", "Generous paid leave plus public holidays",
    "Home office setup budget when you join", "Clear growth plan with yearly salary review",
  ];
  const long = await saveJob(jobInput.parse({
    id: null, title: longTitle, slug: `${prefix}stress-long`, departmentId: department.id,
    brandIds: brandRows.map((brand) => brand.id), primaryBrandId: brandRows[0].id, optionIds: longOptionIds,
    engagementNote: "Full-time with flexible hours, one on-site week per month, plus yearly retreat",
    salaryMode: "range", salaryText: longSalaryText, vacancies: 7,
    experienceText: "6+ years building accessible platforms and design systems",
    skills: longSkills, benefits: longBenefits,
    niceToHaveMd: "- Experience hiring for media or marketplace brands\n- Open-source contributions to web platform tooling\n- Public speaking or technical writing",
    locationText: "Dhaka · Chattogram · Sylhet · Khulna · Remote across Bangladesh with occasional travel to the Dhaka headquarters twice every month",
    deadlineAt: new Date(Date.now() + 14 * 86400000).toISOString(), cvRequired: true,
    summary: longSummary,
    descriptionMd: "Our career site serves **every brand** from one codebase, and the hiring platform must keep pace with a fast-growing catalog of roles across four hiring brands.\n\nRead the [https://example.com/hiring/platform/guidelines/2026/cross-brand-design-system-and-application-flow](https://example.com/hiring/platform/guidelines/2026/cross-brand-design-system-and-application-flow) before you ship your first change.\n\n- Unify the design system across brands\n- Keep accessibility at WCAG 2.2 AA\n- Measure application completion every week",
    responsibilitiesMd: "1. Own the shared careers platform end to end, from database to design\n2. Ship accessible, well-tested components with the design system\n3. Mentor engineers and review design-system changes across teams\n4. Partner with recruitment on application-flow improvements",
    requirementsMd: "- 6+ years building production web applications in TypeScript\n- Strong React and Next.js skills, including the App Router\n- Experience with design systems and accessibility standards\n- Clear written communication in English; Bengali is a plus",
    intent: "publish",
    questions: [
      { id: randomUUID(), label: "Which city are you based in?", type: "short_text", required: true, helpText: null, options: null, config: { maxLength: 200 }, section: "professional", sortOrder: 0 },
    ] }));
  const bengaliTitle = "সিনিয়র ফ্রন্টএন্ড ইঞ্জিনিয়ার (বাংলা কনটেন্ট প্ল্যাটফর্ম, রিমোট)";
  const bengaliSummary = "২০২৬ সাল পর্যন্ত আবেদন চলবে — বাংলা ভাষায় মানসম্মত কনটেন্ট প্ল্যাটফর্ম তৈরি ও পরিচালনার অভিজ্ঞতা প্রয়োজন।";
  const bengaliQuestionLabel = "কাজের অভিজ্ঞতা বিস্তারিত লিখুন";
  const bengaliSalaryText = "৳ ৪০,০০০ – ৭০,০০০ প্রতি মাসে (বার্ষিক বোনাস সহ)";
  const bengali = await saveJob(jobInput.parse({
    id: null, title: bengaliTitle, slug: `${prefix}stress-bengali`, departmentId: department.id,
    brandIds: brandRows.slice(0, 2).map((brand) => brand.id), primaryBrandId: brandRows[0].id, optionIds: bengaliOptionIds,
    engagementNote: null, salaryMode: "range", salaryText: bengaliSalaryText,
    vacancies: null, experienceText: null, skills: [], benefits: [], niceToHaveMd: "",
    locationText: "ঢাকা, বাংলাদেশ", deadlineAt: null, cvRequired: false, summary: bengaliSummary,
    descriptionMd: "## ভূমিকা\n\nআমাদের ব্র্যান্ডগুলো প্রতিদিন হাজারো পাঠকের কাছে পৌঁছায়। ২০২৬ সালের মধ্যে আমরা নতুন কনটেন্ট প্ল্যাটফর্ম চালু করব।\n\n- বাংলা ও ইংরেজি উভয় ভাষায় কাজ করতে হবে\n- অ্যাক্সেসিবিলিটি নিশ্চিত রাখতে হবে",
    responsibilitiesMd: "1. বাংলা ও ইংরেজি উভয় ভাষায় ইন্টারফেস তৈরি ও রক্ষণাবেক্ষণ\n2. দলকে ডিজাইন সিস্টেম ব্যবহারে সাহায্য করা\n3. প্রতিটি পরিবর্তন মোবাইল ও ডেস্কটপে পরীক্ষা করা",
    requirementsMd: "- বাংলা ও ইংরেজি উভয় ভাষায় সাবলীল লেখার ক্ষমতা\n- React ও TypeScript নিয়ে কাজের অভিজ্ঞতা\n- ৳৮০,০০০ পর্যন্ত বাজেট পরিচালনার অভিজ্ঞতা",
    intent: "publish",
    questions: [
      { id: randomUUID(), label: bengaliQuestionLabel, type: "long_text", required: false, helpText: null, options: null, config: { maxLength: 1500 }, section: "professional", sortOrder: 0 },
    ] }));
  return {
    long: { id: long.id, slug: long.slug, title: longTitle, salaryText: longSalaryText },
    bengali: { id: bengali.id, slug: bengali.slug, title: bengaliTitle, summary: bengaliSummary, salaryText: bengaliSalaryText, questionLabel: bengaliQuestionLabel },
  };
}
export async function verifyPublicTestApplication(prefix: string, reference: string) {
  guard(prefix);
  const rows = await getDb().select({ application: applications, slug: jobs.slug }).from(applications).innerJoin(jobs, eq(jobs.id, applications.jobId)).where(eq(applications.reference, reference));
  const row = rows.find((row) => row.slug.startsWith(prefix));
  if (!row) throw new Error("Test application missing");
  const answers = await getDb().select().from(applicationAnswers).where(eq(applicationAnswers.applicationId, row.application.id));
  const files = await getDb().select().from(attachments).where(eq(attachments.applicationId, row.application.id));
  return { applications: 1, answers: answers.length, attachments: files.length,
    bengaliPreserved: row.application.fullName === "শ্রী ক্ষিতিশ" && answers.some((a) => a.value === "আমি সৃজনশীল কাজে অভিজ্ঞ।"),
    snapshotsPresent: !!row.application.jobTitleSnapshot && !!row.application.primaryBrandSnapshot && answers.every((a) => !!a.labelSnapshot),
    attachmentAnswersLinked: answers.filter((a) => a.typeSnapshot === "file_upload").every((a) => Array.isArray(a.value) && a.value.every((id) => files.some((f) => f.id === id))),
    privatePaths: files.every((f) => f.storagePath.startsWith(`applications/${row.application.id}/`)) };
}
