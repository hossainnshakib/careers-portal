import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { listBrands } from "@/db/queries/brands";
import { listDepartments } from "@/db/queries/departments";
import { listJobs } from "@/db/queries/jobs";
import { listJobOptions } from "@/db/queries/job-options";
import { jobFilters, type JobInput } from "@/lib/validation/jobs";
import { JobEditor } from "@/components/admin/job-editor";

export default async function NewJobPage() {
  await requireAdmin().catch(redirectAdminDenial);
  const brands = await listBrands();
  const departments = await listDepartments();
  const sources = await listJobs(jobFilters.parse({}));
  const options = await listJobOptions();
  const initial: JobInput = {
    id: null,
    title: "",
    slug: "",
    departmentId: departments[0]?.id ?? "",
    brandIds: brands[0] ? [brands[0].id] : [],
    primaryBrandId: brands[0]?.id ?? "",
    optionIds: [],
    engagementNote: null,
    salaryMode: "negotiable",
    salaryText: "",
    vacancies: null,
    experienceText: null,
    skills: [],
    benefits: [],
    niceToHaveMd: "",
    locationText: "",
    deadlineAt: null,
    cvRequired: true,
    summary: "",
    descriptionMd: "",
    responsibilitiesMd: "",
    requirementsMd: "",
    questions: [],
    intent: "save",
  };
  return (
    <JobEditor
      initial={initial}
      brands={brands}
      departments={departments}
      sources={sources}
      options={options}
      published={false}
      status="draft"
      hasApplications={false}
    />
  );
}
