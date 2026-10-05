import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer as int,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Data model for the Careers Portal — implements docs/SCHEMA.md exactly.
 *
 * Rules that live in the database (and are therefore here, not only in app code):
 * - RLS enabled on every table with no policies (added in the second migration).
 * - One primary brand per job (partial unique index).
 * - A job's slug cannot change once published (trigger, second migration).
 */

export const sectorEnum = pgEnum("sector", [
  "creative_agency",
  "real_estate",
  "fashion",
  "saas",
  "media",
  "technology",
  "other",
]);

export const employmentTypeEnum = pgEnum("employment_type", [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "freelance",
]);

export const workModeEnum = pgEnum("work_mode", ["onsite", "remote", "hybrid"]);

export const experienceLevelEnum = pgEnum("experience_level", ["entry", "mid", "senior"]);

export const jobStatusEnum = pgEnum("job_status", ["draft", "open", "closed"]);

export const brandStatusEnum = pgEnum("brand_status", ["active", "hidden"]);

export const questionTypeEnum = pgEnum("question_type", [
  "short_text",
  "long_text",
  "single_choice",
  "multiple_choice",
  "yes_no",
  "number",
  "url",
  "email",
  "phone",
  "file_upload",
  "date",
]);

export const questionSectionEnum = pgEnum("question_section", [
  "professional",
  "experience",
  "skills",
  "portfolio",
  "role_specific",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "new",
  "under_review",
  "shortlisted",
  "rejected",
  "hired",
]);

export const attachmentKindEnum = pgEnum("attachment_kind", ["cv", "portfolio", "other"]);

const createdAt = () =>
  timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`);

export const departments = pgTable(
  "departments",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    sortOrder: int("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index("departments_sort_order_idx").on(t.sortOrder)],
);

export const brands = pgTable(
  "brands",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    sector: sectorEnum("sector").notNull(),
    logoUrl: text("logo_url"),
    description: text("description").notNull().default(""),
    website: text("website"),
    accentColor: text("accent_color"),
    status: brandStatusEnum("status").notNull().default("active"),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("brands_sort_order_idx").on(t.sortOrder)],
);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    departmentId: uuid("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "restrict" }),
    employmentType: employmentTypeEnum("employment_type").notNull(),
    workMode: workModeEnum("work_mode").notNull(),
    experienceLevel: experienceLevelEnum("experience_level"),
    locationText: text("location_text"),
    summary: text("summary").notNull().default(""),
    descriptionMd: text("description_md").notNull().default(""),
    responsibilitiesMd: text("responsibilities_md").notNull().default(""),
    requirementsMd: text("requirements_md").notNull().default(""),
    cvRequired: boolean("cv_required").notNull().default(true),
    status: jobStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`)
      .$onUpdate(() => sql`now()`),
  },
  (t) => [
    index("jobs_status_idx").on(t.status),
    index("jobs_department_id_idx").on(t.departmentId),
    index("jobs_sort_order_idx").on(t.sortOrder),
  ],
);

export const jobBrands = pgTable(
  "job_brands",
  {
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "restrict" }),
    isPrimary: boolean("is_primary").notNull().default(false),
  },
  (t) => [
    primaryKey({ columns: [t.jobId, t.brandId] }),
    index("job_brands_job_id_idx").on(t.jobId),
    index("job_brands_brand_id_idx").on(t.brandId),
    // exactly one primary brand per job (application layer guarantees at least one)
    uniqueIndex("job_brands_one_primary_per_job")
      .on(t.jobId)
      .where(sql`is_primary = true`),
  ],
);

export const jobQuestions = pgTable(
  "job_questions",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    helpText: text("help_text"),
    type: questionTypeEnum("type").notNull(),
    required: boolean("required").notNull().default(false),
    options: jsonb("options"),
    config: jsonb("config"),
    section: questionSectionEnum("section").notNull().default("role_specific"),
    sortOrder: int("sort_order").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("job_questions_job_id_sort_order_idx").on(t.jobId, t.sortOrder)],
);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    reference: text("reference").notNull().unique(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "restrict" }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    location: text("location").notNull().default(""),
    status: applicationStatusEnum("status").notNull().default("new"),
    jobTitleSnapshot: text("job_title_snapshot").notNull(),
    jobSlugSnapshot: text("job_slug_snapshot").notNull(),
    departmentNameSnapshot: text("department_name_snapshot").notNull(),
    brandNamesSnapshot: text("brand_names_snapshot").notNull().array(),
    primaryBrandSnapshot: text("primary_brand_snapshot").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("applications_job_id_idx").on(t.jobId),
    index("applications_status_idx").on(t.status),
    index("applications_submitted_at_idx").on(t.submittedAt.desc()),
    index("applications_email_lower_idx").on(sql`lower(email)`),
  ],
);

export const applicationAnswers = pgTable(
  "application_answers",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    questionId: uuid("question_id").references(() => jobQuestions.id, { onDelete: "set null" }),
    labelSnapshot: text("label_snapshot").notNull(),
    typeSnapshot: questionTypeEnum("type_snapshot").notNull(),
    sectionSnapshot: questionSectionEnum("section_snapshot").notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    value: jsonb("value"),
  },
  (t) => [index("application_answers_application_id_idx").on(t.applicationId)],
);

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    questionId: uuid("question_id").references(() => jobQuestions.id, { onDelete: "set null" }),
    kind: attachmentKindEnum("kind").notNull(),
    storagePath: text("storage_path").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: int("size_bytes").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("attachments_application_id_idx").on(t.applicationId)],
);

export const adminNotes = pgTable(
  "admin_notes",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    adminUserId: uuid("admin_user_id").notNull(),
    adminEmailSnapshot: text("admin_email_snapshot").notNull(),
    note: text("note").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("admin_notes_application_id_idx").on(t.applicationId)],
);

export const applicationStatusEvents = pgTable(
  "application_status_events",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    fromStatus: applicationStatusEnum("from_status"),
    toStatus: applicationStatusEnum("to_status").notNull(),
    adminUserId: uuid("admin_user_id"),
    createdAt: createdAt(),
  },
  (t) => [index("application_status_events_application_id_idx").on(t.applicationId)],
);

export const adminUsers = pgTable(
  "admin_users",
  {
    userId: uuid("user_id").primaryKey(),
    email: text("email").notNull(),
    role: text("role").notNull().default("admin"),
    createdAt: createdAt(),
  },
  (t) => [index("admin_users_email_idx").on(t.email)],
);

export type Department = typeof departments.$inferSelect;
export type Brand = typeof brands.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type JobQuestion = typeof jobQuestions.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type ApplicationAnswer = typeof applicationAnswers.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type AdminNote = typeof adminNotes.$inferSelect;
export type ApplicationStatusEvent = typeof applicationStatusEvents.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
