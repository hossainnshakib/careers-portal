import { assertAllowedTarget } from "../../lib/maintenance/target";

/** Fail closed even when production is mislabeled as development. */
export function assertDevTarget(input: {
  appEnv?: string;
  devProjectRef?: string;
  databaseUrl?: string;
  directUrl?: string;
  supabaseUrl?: string;
}) {
  if (input.appEnv !== "development")
    throw new Error("Demo/reset operations require APP_ENV=development.");
  assertAllowedTarget({ ...input, allowedProjectRef: input.devProjectRef });
}
