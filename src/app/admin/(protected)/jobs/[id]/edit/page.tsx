import { z } from "zod";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { listBrands } from "@/db/queries/brands";
import { listDepartments } from "@/db/queries/departments";
import { jobHasApplications, listJobs, loadJob } from "@/db/queries/jobs";
import { jobFilters, type JobInput } from "@/lib/validation/jobs";
import { questionFromRow } from "@/lib/questions/from-row";
import { JobEditor } from "@/components/admin/job-editor";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin().catch(redirectAdminDenial);
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) notFound();
  const loaded = await loadJob(parsed.data);
  if (!loaded) notFound();
  // Serialize the small catalog reads: concurrent mixed-protocol reads stalled
  // the shared transaction pooler during production browser verification.
  const brands = await listBrands();
  const departments = await listDepartments();
  const sources = await listJobs(jobFilters.parse({}));
  const hasApplications = await jobHasApplications(parsed.data);
  const { job, links, questions } = loaded;
  const initial: JobInput = {
    id: job.id,
    title: job.title,
    slug: job.slug,
    departmentId: job.departmentId,
    brandIds: links.map((link) => link.brandId),
    primaryBrandId: links.find((link) => link.isPrimary)?.brandId ?? "",
    employmentType: job.employmentType,
    workMode: job.workMode,
    experienceLevel: job.experienceLevel,
    locationText: job.locationText ?? "",
    deadlineAt: job.deadlineAt?.toISOString() ?? null,
    cvRequired: job.cvRequired,
    summary: job.summary,
    descriptionMd: job.descriptionMd,
    responsibilitiesMd: job.responsibilitiesMd,
    requirementsMd: job.requirementsMd,
    questions: questions.filter((q) => !q.archivedAt).map(questionFromRow),
    intent: "save",
  };
  return (
    <JobEditor
      key={`${job.id}:${job.updatedAt.toISOString()}`}
      initial={initial}
      brands={brands}
      departments={departments}
      sources={sources}
      published={!!job.publishedAt}
      status={job.status}
      hasApplications={hasApplications}
      archivedLabels={questions.filter((q) => q.archivedAt).map((q) => q.label)}
    />
  );
}
