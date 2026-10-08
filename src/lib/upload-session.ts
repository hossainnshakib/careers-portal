import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";

const sessionSchema = z.strictObject({ id: z.uuid(), jobSlug: z.string().max(120), issuedAt: z.number().int(), expiresAt: z.number().int() });
export type UploadSession = z.infer<typeof sessionSchema>;
export function createUploadSession(jobSlug: string) {
  const issuedAt = Date.now();
  const session: UploadSession = { id: randomUUID(), jobSlug, issuedAt, expiresAt: issuedAt + 2 * 60 * 60 * 1000 };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = createHmac("sha256", getServerEnv().UPLOAD_SESSION_SECRET).update(payload).digest("base64url");
  return { session, token: `${payload}.${signature}` };
}
export function verifyUploadSession(token: string, jobSlug: string): UploadSession {
  if (token.length > 2048) throw new Error("Invalid upload session");
  const parts = token.split(".");
  if (parts.length !== 2 || !parts.every((part) => /^[\w-]+$/.test(part))) throw new Error("Invalid upload session");
  const expected = createHmac("sha256", getServerEnv().UPLOAD_SESSION_SECRET).update(parts[0]).digest();
  const supplied = Buffer.from(parts[1], "base64url");
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new Error("Invalid upload session");
  const session = sessionSchema.parse(JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")));
  const now = Date.now();
  if (session.jobSlug !== jobSlug || session.expiresAt <= now || session.issuedAt > now || session.expiresAt - session.issuedAt !== 7200000)
    throw new Error("Invalid upload session");
  return session;
}
