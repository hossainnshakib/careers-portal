import { z } from "zod";

type SiteEnvironment = {
  [name: string]: string | undefined;
  NEXT_PUBLIC_SITE_URL?: string; VERCEL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string; VERCEL_URL?: string;
};

/** No request Host input or secrets: only owner settings/platform hostnames. */
export function resolveSiteUrl(environment: SiteEnvironment): string {
  const explicit = environment.NEXT_PUBLIC_SITE_URL;
  const vercelHost = environment.VERCEL === "1"
    ? environment.VERCEL_PROJECT_PRODUCTION_URL || environment.VERCEL_URL : undefined;
  const value = explicit || (vercelHost ? `https://${vercelHost}` : "http://localhost:3000");
  const parsed = z.url({ protocol: /^https?$/ }).safeParse(value);
  if (!parsed.success) throw new Error("Invalid public site URL setting.");
  const url = new URL(parsed.data);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/")
    throw new Error("Public site URL must be an HTTP(S) origin without credentials, path, query or fragment.");
  return url.origin;
}
