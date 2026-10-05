import "server-only";

import { randomUUID } from "node:crypto";
import { and, asc, eq, ilike, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { applications, brands, departments, jobBrands, jobQuestions, jobs } from "@/db/schema";
import { checkJobCommand, checkJobEdit, removedQuestionIds } from "@/lib/questions/job-policy";
import { uniqueSlug } from "@/lib/slug";
import { jobFilters, type JobInput } from "@/lib/validation/jobs";

export async function listJobs(filters: ReturnType<typeof jobFilters.parse>) {
  const linked = filters.brand
    ? getDb()
        .select({ id: jobBrands.jobId })
        .from(jobBrands)
        .where(eq(jobBrands.brandId, filters.brand))
    : null;
  return getDb()
    .select({
      id: jobs.id,
      title: jobs.title,
      slug: jobs.slug,
      status: jobs.status,
      department: departments.name,
      publishedAt: jobs.publishedAt,
    })
    .from(jobs)
    .innerJoin(departments, eq(departments.id, jobs.departmentId))
    .where(
      and(
        filters.status ? eq(jobs.status, filters.status) : undefined,
        filters.department ? eq(jobs.departmentId, filters.department) : undefined,
        linked ? inArray(jobs.id, linked) : undefined,
        filters.q ? ilike(jobs.title, `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`) : undefined,
      ),
    )
    .orderBy(asc(jobs.sortOrder), asc(jobs.title));
}

export async function loadJob(id: string) {
  const db = getDb();
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return null;
  const links = await db.select().from(jobBrands).where(eq(jobBrands.jobId, id));
  const questions = await db
    .select()
    .from(jobQuestions)
    .where(eq(jobQuestions.jobId, id))
    .orderBy(asc(jobQuestions.sortOrder));
  return { job, links, questions };
}

export async function jobHasApplications(id: string) {
  const [row] = await getDb()
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.jobId, id))
    .limit(1);
  return !!row;
}

export async function saveJob(input: JobInput) {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(1103)`);
    const [existing] = input.id
      ? await tx.select().from(jobs).where(eq(jobs.id, input.id)).for("update")
      : [];
    if (input.id && !existing) throw new Error("Job not found");
    checkJobEdit(existing ?? null, input);
    const [dept] = await tx
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.id, input.departmentId));
    const selected = await tx
      .select({ id: brands.id })
      .from(brands)
      .where(inArray(brands.id, input.brandIds));
    if (!dept || selected.length !== input.brandIds.length)
      throw new Error("Invalid department or brands");
    const id = existing?.id ?? randomUUID();
    const existingQuestions = existing
      ? await tx.select().from(jobQuestions).where(eq(jobQuestions.jobId, id)).for("update")
      : [];
    const allIncoming = input.questions.length
      ? await tx
          .select({ id: jobQuestions.id, jobId: jobQuestions.jobId })
          .from(jobQuestions)
          .where(
            inArray(
              jobQuestions.id,
              input.questions.map((q) => q.id),
            ),
          )
      : [];
    if (allIncoming.some((q) => q.jobId !== id)) throw new Error("Question belongs to another job");
    const removed = removedQuestionIds(
      existingQuestions,
      input.questions.map((q) => q.id),
    );
    const [application] = existing
      ? await tx
          .select({ id: applications.id })
          .from(applications)
          .where(eq(applications.jobId, id))
          .limit(1)
      : [];
    const { brandIds, primaryBrandId, questions, intent, deadlineAt, ...fields } = input;
    const now = new Date();
    const values = {
      ...fields,
      id,
      deadlineAt: deadlineAt ? new Date(deadlineAt) : null,
      status: intent === "publish" ? ("open" as const) : (existing?.status ?? ("draft" as const)),
      publishedAt: existing?.publishedAt ?? (intent === "publish" ? now : null),
      closedAt: intent === "publish" ? null : (existing?.closedAt ?? null),
      updatedAt: now,
    };
    if (existing) await tx.update(jobs).set(values).where(eq(jobs.id, id));
    else await tx.insert(jobs).values(values);
    await tx.delete(jobBrands).where(eq(jobBrands.jobId, id));
    await tx
      .insert(jobBrands)
      .values(
        brandIds.map((brandId) => ({ jobId: id, brandId, isPrimary: brandId === primaryBrandId })),
      );
    if (removed.length) {
      if (application)
        await tx
          .update(jobQuestions)
          .set({ archivedAt: now })
          .where(inArray(jobQuestions.id, removed));
      else await tx.delete(jobQuestions).where(inArray(jobQuestions.id, removed));
    }
    const known = new Set(existingQuestions.map((q) => q.id));
    for (const [sortOrder, q] of questions.entries()) {
      const values = { ...q, jobId: id, sortOrder };
      if (known.has(q.id))
        await tx
          .update(jobQuestions)
          .set(values)
          .where(and(eq(jobQuestions.id, q.id), eq(jobQuestions.jobId, id)));
      else await tx.insert(jobQuestions).values(values);
    }
    return { id, slug: input.slug, previousSlug: existing?.slug ?? input.slug };
  });
}

export async function mutateJob(id: string, command: "close" | "reopen" | "duplicate" | "delete") {
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(1103)`);
    const [job] = await tx.select().from(jobs).where(eq(jobs.id, id)).for("update");
    if (!job) throw new Error("Job not found");
    const [application] = await tx
      .select({ id: applications.id })
      .from(applications)
      .where(eq(applications.jobId, id))
      .limit(1);
    checkJobCommand(job, command, !!application);
    if (command === "delete") await tx.delete(jobs).where(eq(jobs.id, id));
    else if (command === "duplicate") {
      const newId = randomUUID();
      const used = new Set(
        (await tx.select({ slug: jobs.slug }).from(jobs)).map((row) => row.slug),
      );
      const slug = uniqueSlug(`${job.slug.slice(0, 110).replace(/-+$/, "")}-copy`, used);
      const now = new Date();
      await tx.insert(jobs).values({
        ...job,
        id: newId,
        title: `${job.title.slice(0, 193)} (copy)`,
        slug,
        status: "draft",
        publishedAt: null,
        closedAt: null,
        createdAt: now,
        updatedAt: now,
      });
      const links = await tx.select().from(jobBrands).where(eq(jobBrands.jobId, id));
      if (!links.length || links.filter((link) => link.isPrimary).length !== 1)
        throw new Error("Invalid source brands");
      await tx.insert(jobBrands).values(links.map((link) => ({ ...link, jobId: newId })));
      const questions = await tx
        .select()
        .from(jobQuestions)
        .where(and(eq(jobQuestions.jobId, id), sql`${jobQuestions.archivedAt} is null`));
      if (questions.length)
        await tx
          .insert(jobQuestions)
          .values(questions.map((q) => ({ ...q, id: randomUUID(), jobId: newId, createdAt: now })));
      return { id: newId, slug, previousSlug: job.slug };
    } else
      await tx
        .update(jobs)
        .set({
          status: command === "close" ? "closed" : "open",
          closedAt: command === "close" ? new Date() : null,
        })
        .where(eq(jobs.id, id));
    return { id, slug: job.slug, previousSlug: job.slug };
  });
}
