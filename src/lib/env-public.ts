import "./validation/zod-csp";
import { z } from "zod";
import { resolveSiteUrl } from "./site-url";

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url({ protocol: /^https?$/ }),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  NEXT_PUBLIC_CONTACT_EMAIL: z.preprocess((value) => value === "" ? undefined : value, z.email().optional()),
});
export type PublicEnv = z.infer<typeof publicSchema>;
let cache: PublicEnv | undefined;

/** Only literal NEXT_PUBLIC references: safe for client bundles and Next.js inlining. */
export function getPublicEnv(): PublicEnv {
  if (cache) return cache;
  const result = publicSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: getPublicSiteUrl(),
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  });
  if (!result.success) {
    throw new Error(
      `Invalid public environment keys: ${result.error.issues.map((issue) => issue.path.join(".")).join(", ")}. Check .env.local.`,
    );
  }
  cache = result.data;
  return cache;
}
export function getSecurityEnvironment() {
  const parsed = z.url().safeParse(process.env.NEXT_PUBLIC_SUPABASE_URL);
  return { supabaseOrigin: parsed.success ? new URL(parsed.data).origin : null, development: process.env.NODE_ENV !== "production" };
}

/** Metadata and contact pages can render before database credentials exist. */
export function getPublicSiteUrl(): string {
  return resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL: process.env.VERCEL, VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_URL: process.env.VERCEL_URL });
}
export function getPublicContactEmail(): string | undefined {
  const parsed = publicSchema.shape.NEXT_PUBLIC_CONTACT_EMAIL.safeParse(process.env.NEXT_PUBLIC_CONTACT_EMAIL);
  if (!parsed.success) throw new Error("Invalid public contact email setting.");
  return parsed.data;
}
