-- Fix rows where salary_mode is 'range' but salary_text is blank/null:
-- public falls back to "Negotiable" while the editor shows the stored range mode.
UPDATE "jobs"
SET "salary_mode" = 'negotiable'
WHERE "salary_mode" = 'range' AND ("salary_text" IS NULL OR btrim("salary_text") = '');--> statement-breakpoint

-- Require non-blank single-line salary_text whenever salary_mode is 'range'.
ALTER TABLE "jobs" DROP CONSTRAINT IF EXISTS "jobs_salary_range_text_check";--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_salary_range_text_check"
  CHECK ("salary_mode" = 'negotiable' OR ("salary_text" IS NOT NULL AND btrim("salary_text") <> ''));
