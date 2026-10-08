import "server-only";

import { z } from "zod";
import { appEnvSchema } from "./app-env";
export { getPublicEnv } from "./env-public";
export type { PublicEnv } from "./env-public";

/**
 * Environment validation.
 *
 * - Server-only variables live in `serverSchema` and are read through `getServerEnv()`.
 * - Browser-visible variables live in `publicSchema` and are read through `getPublicEnv()`.
 *   Every `NEXT_PUBLIC_*` value is referenced literally so Next.js can inline it at build time.
 *
 * Validation is lazy (first access) but strict: a missing or malformed value throws a single
 * message listing everything that is wrong. The production startup check is eager:
 * `next.config.ts` calls `assertStartupEnvironment` (from `./app-env`) so a production build
 * fails at startup instead of lazily on the first request.
 */

const serverSchema = z.object({
  APP_ENV: appEnvSchema,
  DEV_SUPABASE_PROJECT_REF: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .string()
      .regex(/^[a-z0-9]{20}$/)
      .optional(),
  ),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "required"),
  DATABASE_URL: z
    .string()
    .min(1, "required")
    .refine((v) => /^postgres(ql)?:\/\//.test(v), "must be a postgres:// connection string"),
  DIRECT_URL: z
    .string()
    .min(1, "required")
    .refine((v) => /^postgres(ql)?:\/\//.test(v), "must be a postgres:// connection string"),
  UPLOAD_SESSION_SECRET: z.string().min(32, "must be at least 32 characters"),
  CRON_SECRET: z.string().min(32, "must be at least 32 characters"),
  TURNSTILE_SECRET_KEY: z.string().min(1, "required"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

function parseOrThrow<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
  values: Record<string, string | undefined>,
  label: string,
): z.infer<T> {
  const result = schema.safeParse(values);
  if (result.success) return result.data;

  const details = result.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `Invalid ${label} environment variables:\n${details}\n\n` +
      `Fill in .env.local (copy it from .env.example). See docs/ARCHITECTURE.md.`,
  );
}

let serverCache: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  serverCache ??= parseOrThrow(serverSchema, process.env, "server");
  return serverCache;
}

/** Minimal server-only subset for guarded dev database maintenance. */
export function getDevDatabaseEnv() {
  const schema = serverSchema
    .pick({ APP_ENV: true, DEV_SUPABASE_PROJECT_REF: true, DATABASE_URL: true, DIRECT_URL: true })
    .extend({ NEXT_PUBLIC_SUPABASE_URL: z.url() });
  return parseOrThrow(schema, process.env, "dev database");
}

/** Non-throwing check for pages that should show a friendly "not configured" state. */
export function isServerEnvConfigured(): boolean {
  try {
    getServerEnv();
    return true;
  } catch {
    return false;
  }
}
