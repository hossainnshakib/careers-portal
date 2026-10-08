import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { closeDb } from "./index";
import { getPublicEnv } from "@/lib/env";
import { requireAllowedTarget } from "@/lib/maintenance/require-target";
import { listPosterJobs } from "./queries/poster-links";
import { posterCampaignSchema, posterLinksCsv } from "@/lib/careers/poster-links";

try {
  requireAllowedTarget();
  const campaign = posterCampaignSchema.parse(process.argv[2] ?? "recruitment-v1");
  const jobs = await listPosterJobs();
  const csv = posterLinksCsv(jobs, getPublicEnv().NEXT_PUBLIC_SITE_URL, campaign);
  await mkdir("exports", { recursive: true });
  await writeFile("exports/job-links.csv", csv, "utf8");
  console.info(`Public poster links generated: ${jobs.length}. Output: exports/job-links.csv`);
} catch {
  console.error("Link generation refused or failed. Check allowed target, public site URL and campaign.");
  process.exitCode = 1;
} finally { await closeDb(); }
