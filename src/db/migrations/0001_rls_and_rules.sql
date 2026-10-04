ALTER TABLE "departments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "jobs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "job_brands" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "job_questions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "applications" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "application_answers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "attachments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "admin_notes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "application_status_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "admin_users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE UNIQUE INDEX "job_brands_one_primary_per_job" ON "job_brands" USING btree ("job_id") WHERE is_primary = true;
--> statement-breakpoint
CREATE FUNCTION public.jobs_slug_immutable() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF OLD.published_at IS NOT NULL AND NEW.published_at IS DISTINCT FROM OLD.published_at THEN
    RAISE EXCEPTION 'First publication timestamp cannot be changed';
  END IF;
  IF OLD.published_at IS NOT NULL AND NEW.slug IS DISTINCT FROM OLD.slug THEN
    RAISE EXCEPTION 'Job slug cannot change after first publication';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER jobs_slug_immutable BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.jobs_slug_immutable();
