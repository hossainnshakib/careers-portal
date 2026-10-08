import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";

/** Compare fixed-length digests so the bearer secret is never compared as text. */
export function hasCronAuthorization(header: string | null): boolean {
  const parsed = z.string().min(1).max(2048).safeParse(header);
  if (!parsed.success) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(parsed.data), digest(`Bearer ${getServerEnv().CRON_SECRET}`));
}
