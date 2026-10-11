CREATE TYPE "public"."option_group" AS ENUM('arrangement', 'engagement', 'experience');--> statement-breakpoint
CREATE TYPE "public"."salary_mode" AS ENUM('negotiable', 'range');--> statement-breakpoint
CREATE TABLE "job_option_links" (
	"job_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	CONSTRAINT "job_option_links_job_id_option_id_pk" PRIMARY KEY("job_id","option_id")
);
--> statement-breakpoint
CREATE TABLE "job_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group" "option_group" NOT NULL,
	"label" text NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "consent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "engagement_note" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_mode" "salary_mode" DEFAULT 'negotiable' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_text" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "vacancies" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "experience_text" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "skills" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "benefits" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "nice_to_have_md" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "job_option_links" ADD CONSTRAINT "job_option_links_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_option_links" ADD CONSTRAINT "job_option_links_option_id_job_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."job_options"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_option_links_option_id_idx" ON "job_option_links" USING btree ("option_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_options_group_slug_unique" ON "job_options" USING btree ("group","slug");--> statement-breakpoint
CREATE INDEX "job_options_group_sort_order_idx" ON "job_options" USING btree ("group","sort_order");--> statement-breakpoint
ALTER TABLE "job_options" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "job_option_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
INSERT INTO "job_options" ("group","label","slug","sort_order","is_active") VALUES
	('arrangement','On-site','onsite',1,true),
	('arrangement','Hybrid','hybrid',2,true),
	('arrangement','Work from home','remote',3,true),
	('engagement','Full-time','full_time',1,true),
	('engagement','Part-time','part_time',2,true),
	('engagement','Project-based','project-based',3,true),
	('engagement','Duration-based','contract',4,true),
	('engagement','Internship','internship',5,true),
	('engagement','Freelance','freelance',6,true),
	('experience','Fresher welcome','fresher-welcome',1,true),
	('experience','Entry-level','entry',2,true),
	('experience','Mid-level','mid',3,true),
	('experience','Senior','senior',4,true)
ON CONFLICT ("group","slug") DO NOTHING;--> statement-breakpoint
INSERT INTO "job_option_links" ("job_id","option_id")
SELECT "j"."id", "o"."id"
FROM "jobs" "j"
JOIN "job_options" "o" ON (
	("o"."group" = 'arrangement' AND "o"."slug" = "j"."work_mode"::text)
	OR ("o"."group" = 'engagement' AND "o"."slug" = "j"."employment_type"::text)
	OR ("o"."group" = 'experience' AND "j"."experience_level" IS NOT NULL AND "o"."slug" = "j"."experience_level"::text)
)
ON CONFLICT DO NOTHING;