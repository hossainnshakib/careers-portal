import { departmentData, jobData } from "./data";

/** Required type/mode values are editable placeholders on unpublished drafts. */
export function buildJobShells(departments: { id: string; slug: string }[]) {
  return jobData.map(([title, slug, departmentNumber], index) => {
    const department = departments.find(row => row.slug === departmentData[departmentNumber - 1][1]);
    if (!department) throw new Error("Seed the final departments before creating draft shells.");
    return { title, slug, departmentId: department.id, employmentType: "full_time" as const,
      workMode: "onsite" as const, status: "draft" as const, sortOrder: index + 1,
      summary: "", descriptionMd: "", responsibilitiesMd: "", requirementsMd: "", cvRequired: true };
  });
}
