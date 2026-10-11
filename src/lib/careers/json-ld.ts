/**
 * JSON-LD JobPosting structured data for open job pages.
 *
 * Emits schema.org JobPosting per Google's job posting guidelines.
 * Pure function: no DB, no React, no env reads — easy to unit-test.
 * Omits any field with no value; never emits baseSalary (salary is free text).
 */

type JobPostingInput = {
  title: string;
  summary: string | null;
  descriptionMd: string;
  slug: string;
  locationText: string | null;
  status: string;
  deadlineAt: string | null;
  publishedAt: string | null;
  departmentName: string;
  options: { group: string; slug: string; label: string }[];
  brand: { name: string; website: string | null; logoUrl: string | null } | null;
  siteOrigin: string;
};

/** Strip markdown to plain text for the JSON-LD description field. */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")       // fenced code blocks
    .replace(/`([^`]*)`/g, "$1")           // inline code → content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")  // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → text
    .replace(/^[#>\s]+/gm, "")              // heading/blockquote markers
    .replace(/^[-*+]\s+/gm, "")             // list markers
    .replace(/\*\*([^*]+)\*\*/g, "$1")      // bold
    .replace(/\*([^*]+)\*/g, "$1")          // italic
    .replace(/__([^_]+)__/g, "$1")          // bold (underscore)
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Map engagement option labels/slugs to schema.org EmploymentType.
 * Schema enum: FULL_TIME, PART_TIME, CONTRACTOR, INTERN, TEMPORARY, VOLUNTEER, PER_DIEM, OTHER.
 */
const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  full_time: "FULL_TIME", "full-time": "FULL_TIME", "fulltime": "FULL_TIME",
  part_time: "PART_TIME", "part-time": "PART_TIME", "parttime": "PART_TIME",
  contract: "CONTRACTOR", "contractor": "CONTRACTOR", "freelance": "CONTRACTOR",
  "project-based": "CONTRACTOR", "project_based": "CONTRACTOR", "projectbased": "CONTRACTOR",
  "duration-based": "CONTRACTOR", "duration_based": "CONTRACTOR", "durationbased": "CONTRACTOR",
  internship: "INTERN", "intern": "INTERN",
};

function employmentType(options: { group: string; slug: string; label: string }[]): string | undefined {
  const engagement = options.find((option) => option.group === "engagement");
  if (!engagement) return undefined;
  const key = engagement.slug.toLowerCase();
  return EMPLOYMENT_TYPE_MAP[key] ?? EMPLOYMENT_TYPE_MAP[engagement.label.toLowerCase()];
}

function isWorkFromHome(options: { group: string; slug: string; label: string }[]): boolean {
  return options.some((option) =>
    option.group === "arrangement"
    && (option.slug.toLowerCase().includes("home") || option.label.toLowerCase().includes("work from home") || option.label.toLowerCase().includes("remote")));
}

/**
 * Build the JobPosting object, or null when the job must not emit structured data.
 * Returns null for closed, expired, draft jobs or when title/brand is missing.
 */
export function buildJobPosting(input: JobPostingInput): Record<string, unknown> | null {
  // Never emit for closed, expired or draft jobs.
  if (input.status !== "open") return null;
  if (input.deadlineAt && new Date(input.deadlineAt).getTime() <= Date.now()) return null;
  if (!input.title.trim()) return null;

  const url = `${input.siteOrigin.replace(/\/$/, "")}/jobs/${input.slug}`;
  const plainDescription = markdownToPlainText(input.descriptionMd || input.summary || "");

  const posting: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: input.title,
    url,
    jobSite: input.siteOrigin,
    datePosted: input.publishedAt ?? undefined,
    validThrough: input.deadlineAt ?? undefined,
    employmentType: employmentType(input.options) ?? undefined,
    description: plainDescription || undefined,
    hiringOrganization: input.brand
      ? {
        "@type": "Organization",
        name: input.brand.name,
        sameAs: input.brand.website ?? undefined,
        logo: input.brand.logoUrl ?? undefined,
      }
      : undefined,
    jobLocation: input.locationText
      ? {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressCountry: "BD",
          addressLocality: input.locationText,
        },
      }
      : undefined,
    jobLocationType: isWorkFromHome(input.options) ? "TELECOMMUTE" : undefined,
    // baseSalary omitted: salary is free text, not a structured value.
  };

  // Omit any field that has no value (undefined keys are stripped).
  for (const key of Object.keys(posting)) {
    if (posting[key] === undefined) delete posting[key];
  }
  return posting;
}
