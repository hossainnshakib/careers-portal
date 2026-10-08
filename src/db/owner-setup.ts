import "server-only";
import { closeDb } from "./index";
import { requireAllowedTarget } from "@/lib/maintenance/require-target";
import { runMigrations } from "./migrate";
import { seedBase } from "./seed/base";
import { z } from "zod";

try {
  requireAllowedTarget();
  const operation = z.enum(["migrate", "base"]).parse(process.argv[2]);
  if (operation === "migrate") await runMigrations();
  else await seedBase();
  console.info("Allowed-target setup completed.");
} catch {
  console.error("Owner setup refused or failed. Check the explicit target and selected operation.");
  process.exitCode = 1;
} finally { await closeDb(); }
