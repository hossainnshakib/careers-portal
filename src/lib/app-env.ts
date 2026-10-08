import { z } from "zod";

/**
 * APP_ENV is explicit on purpose: there is no default, so a production build
 * with APP_ENV missing, empty or unrecognised fails loudly instead of silently
 * falling back to development and accepting Cloudflare's always-pass test keys.
 *
 * This module deliberately does not import "server-only": next.config.ts
 * evaluates it before the Next.js server exists.
 */
export const appEnvSchema = z.enum(
  ["development", "production"],
  "APP_ENV must be set explicitly to 'development' or 'production'.",
);

/** Cloudflare's documented test site keys: https://developers.cloudflare.com/turnstile/troubleshooting/testing/ */
export const turnstileTestSiteKeys = new Set([
  "1x00000000000000000000AA",
  "2x00000000000000000000AB",
  "1x00000000000000000000BB",
  "2x00000000000000000000BB",
  "3x00000000000000000000FF",
]);

/** Cloudflare's documented test secret keys (same page as the site keys). */
export const turnstileTestSecretKeys = new Set([
  "1x0000000000000000000000000000000AA",
  "2x0000000000000000000000000000000AA",
  "3x0000000000000000000000000000000AA",
]);

export function isTurnstileTestSiteKey(value: unknown): boolean {
  return typeof value === "string" && turnstileTestSiteKeys.has(value);
}

export function isTurnstileTestSecretKey(value: unknown): boolean {
  return typeof value === "string" && turnstileTestSecretKeys.has(value);
}

/**
 * Fails `next build` and `next start` (both run with NODE_ENV=production and
 * both evaluate next.config after loading the .env files) when APP_ENV is
 * missing or unrecognised, or when Turnstile test keys are configured outside
 * an explicit APP_ENV=development. Values are never printed.
 */
export function assertStartupEnvironment(
  values: Record<string, string | undefined>,
  nodeEnv: string | undefined,
): void {
  if (nodeEnv !== "production") return;
  const parsed = appEnvSchema.safeParse(values.APP_ENV);
  if (!parsed.success) {
    throw new Error(
      [
        "Refusing to start with NODE_ENV=production:",
        ...parsed.error.issues.map((issue) => `  - APP_ENV: ${issue.message}`),
        "Set APP_ENV=development (local/CI) or APP_ENV=production (deployment) in the environment.",
      ].join("\n"),
    );
  }
  if (parsed.data === "development") return;
  const testKeys = [
    isTurnstileTestSiteKey(values.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    isTurnstileTestSecretKey(values.TURNSTILE_SECRET_KEY) && "TURNSTILE_SECRET_KEY",
  ].filter((name): name is string => typeof name === "string");
  if (testKeys.length)
    throw new Error(
      `Refusing to start with NODE_ENV=production: ${testKeys.join(" and ")} ` +
        `hold${testKeys.length === 1 ? "s" : ""} a Cloudflare Turnstile test key, which is only allowed with APP_ENV=development.`,
    );
}
