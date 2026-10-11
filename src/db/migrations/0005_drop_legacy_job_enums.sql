ALTER TABLE "jobs" DROP COLUMN "employment_type";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "work_mode";--> statement-breakpoint
ALTER TABLE "jobs" DROP COLUMN "experience_level";--> statement-breakpoint
DROP TYPE "public"."employment_type";--> statement-breakpoint
DROP TYPE "public"."experience_level";--> statement-breakpoint
DROP TYPE "public"."work_mode";