CREATE TYPE "public"."application_status" AS ENUM('new', 'under_review', 'shortlisted', 'rejected', 'hired');--> statement-breakpoint
CREATE TYPE "public"."attachment_kind" AS ENUM('cv', 'portfolio', 'other');--> statement-breakpoint
CREATE TYPE "public"."brand_status" AS ENUM('active', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'part_time', 'contract', 'internship', 'freelance');--> statement-breakpoint
CREATE TYPE "public"."experience_level" AS ENUM('entry', 'mid', 'senior');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."question_section" AS ENUM('professional', 'experience', 'skills', 'portfolio', 'role_specific');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('short_text', 'long_text', 'single_choice', 'multiple_choice', 'yes_no', 'number', 'url', 'email', 'phone', 'file_upload');--> statement-breakpoint
CREATE TYPE "public"."sector" AS ENUM('creative_agency', 'real_estate', 'fashion', 'saas', 'media', 'technology', 'other');--> statement-breakpoint
CREATE TYPE "public"."work_mode" AS ENUM('onsite', 'remote', 'hybrid');--> statement-breakpoint
CREATE TABLE "admin_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"admin_email_snapshot" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"question_id" uuid,
	"label_snapshot" text NOT NULL,
	"type_snapshot" "question_type" NOT NULL,
	"section_snapshot" "question_section" NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"value" jsonb
);
--> statement-breakpoint
CREATE TABLE "application_status_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"from_status" "application_status",
	"to_status" "application_status" NOT NULL,
	"admin_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"job_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"status" "application_status" DEFAULT 'new' NOT NULL,
	"job_title_snapshot" text NOT NULL,
	"job_slug_snapshot" text NOT NULL,
	"department_name_snapshot" text NOT NULL,
	"brand_names_snapshot" text[],
	"primary_brand_snapshot" text NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"question_id" uuid,
	"kind" "attachment_kind" NOT NULL,
	"storage_path" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sector" "sector" NOT NULL,
	"logo_url" text,
	"description" text DEFAULT '' NOT NULL,
	"website" text,
	"accent_color" text,
	"status" "brand_status" DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "job_brands" (
	"job_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	CONSTRAINT "job_brands_job_id_brand_id_pk" PRIMARY KEY("job_id","brand_id")
);
--> statement-breakpoint
CREATE TABLE "job_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"label" text NOT NULL,
	"help_text" text,
	"type" "question_type" NOT NULL,
	"required" boolean DEFAULT false NOT NULL,
	"options" jsonb,
	"config" jsonb,
	"section" "question_section" DEFAULT 'role_specific' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"department_id" uuid NOT NULL,
	"employment_type" "employment_type" NOT NULL,
	"work_mode" "work_mode" NOT NULL,
	"experience_level" "experience_level",
	"location_text" text,
	"summary" text DEFAULT '' NOT NULL,
	"description_md" text DEFAULT '' NOT NULL,
	"responsibilities_md" text DEFAULT '' NOT NULL,
	"requirements_md" text DEFAULT '' NOT NULL,
	"cv_required" boolean DEFAULT true NOT NULL,
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"deadline_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_answers" ADD CONSTRAINT "application_answers_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_answers" ADD CONSTRAINT "application_answers_question_id_job_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."job_questions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status_events" ADD CONSTRAINT "application_status_events_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_question_id_job_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."job_questions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_brands" ADD CONSTRAINT "job_brands_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_brands" ADD CONSTRAINT "job_brands_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_questions" ADD CONSTRAINT "job_questions_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_notes_application_id_idx" ON "admin_notes" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "admin_users_email_idx" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "application_answers_application_id_idx" ON "application_answers" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "application_status_events_application_id_idx" ON "application_status_events" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "applications_job_id_idx" ON "applications" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "applications_submitted_at_idx" ON "applications" USING btree ("submitted_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "applications_email_lower_idx" ON "applications" USING btree (lower(email));--> statement-breakpoint
CREATE INDEX "attachments_application_id_idx" ON "attachments" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "brands_sort_order_idx" ON "brands" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "departments_sort_order_idx" ON "departments" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "job_brands_job_id_idx" ON "job_brands" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "job_brands_brand_id_idx" ON "job_brands" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "job_questions_job_id_sort_order_idx" ON "job_questions" USING btree ("job_id","sort_order");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jobs_department_id_idx" ON "jobs" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "jobs_sort_order_idx" ON "jobs" USING btree ("sort_order");
