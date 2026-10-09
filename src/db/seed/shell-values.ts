import { departmentData, jobData } from "./data";

/** Draft shells carry editable placeholders; option IDs are attached after options exist. */
export function buildJobShells(departments: { id: string; slug: string }[]) {
  return jobData.map(([title, slug, departmentNumber], index) => {
    const department = departments.find(row => row.slug === departmentData[departmentNumber - 1][1]);
    if (!department) throw new Error("Seed the final departments before creating draft shells.");
    return { title, slug, departmentId: department.id, status: "draft" as const, sortOrder: index + 1,
      optionIds: [] as string[], engagementNote: null, salaryMode: "negotiable" as const, salaryText: "",
      vacancies: null, experienceText: null, skills: [] as string[], benefits: [] as string[], niceToHaveMd: "",
      summary: "", descriptionMd: "", responsibilitiesMd: "", requirementsMd: "", cvRequired: true };
  });
}
