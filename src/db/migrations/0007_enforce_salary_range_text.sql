-- Forward correction for the unjournaled historical 0006 file. Do not replay it:
-- no row normalization, constraint drop or historical ledger fabrication.
-- Existing conflicting constraints/invalid data deliberately stop migration.
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_salary_range_text_check" CHECK ("jobs"."salary_mode" = 'negotiable' OR ("jobs"."salary_text" IS NOT NULL AND btrim("jobs"."salary_text") <> ''));
