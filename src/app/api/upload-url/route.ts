import { z } from "zod";
import { NextResponse } from "next/server";
import { loadApplicationJob } from "@/db/queries/public-jobs";
import { existingSessionApplication, withUploadSession } from "@/db/queries/applications";
import { createUploadSession, verifyUploadSession } from "@/lib/upload-session";
import { verifyTurnstile } from "@/lib/turnstile";
import { jobSlugSchema, uploadRequestSchema } from "@/lib/validation/uploads";
import { reserveUpload } from "@/lib/storage/application-files";

export const runtime = "nodejs";
export const maxDuration = 60;
const requestSchema = z.union([uploadRequestSchema, z.strictObject({ jobSlug: jobSlugSchema, turnstileToken: z.string().min(1).max(2048) })]);
const response = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
export async function POST(request: Request) {
  try {
    // Stream-limited JSON parsing prevents a public endpoint accepting oversized bodies.
    if (!request.body) return response({ ok: false, error: "Invalid upload request." }, 400);
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = []; let length = 0;
    try {
      while (true) { const chunk = await reader.read(); if (chunk.done) break; length += chunk.value.length; if (length > 8192) return response({ ok: false, error: "Invalid upload request." }, 413); chunks.push(chunk.value); }
    } finally { await reader.cancel(); }
    const parsed = requestSchema.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (!parsed.success) return response({ ok: false, error: "Invalid upload request." }, 400);
    const input = parsed.data;
    let sessionToken = "sessionToken" in input ? input.sessionToken : undefined;
    if (!sessionToken) {
      if (!input.turnstileToken || !(await verifyTurnstile(input.turnstileToken))) return response({ ok: false, error: "Complete the security check and try again." }, 400);
      sessionToken = createUploadSession(input.jobSlug).token;
    }
    const session = verifyUploadSession(sessionToken, input.jobSlug);
    const authorized = await withUploadSession(session.id, async (tx) => {
      verifyUploadSession(sessionToken, input.jobSlug);
      if (await existingSessionApplication(tx, session.id)) throw new Error("Session already submitted");
      const definition = await loadApplicationJob(input.jobSlug, tx);
      if (!definition || definition.job.status !== "open" || (definition.job.deadlineAt && definition.job.deadlineAt.getTime() <= Date.now()) || !definition.brands.some((b) => b.brand.status === "active")) throw new Error("Job unavailable");
      return "slot" in input ? await reserveUpload(session, input, definition.questions) : {};
    });
    return response({ ok: true, data: { ...authorized, sessionToken } });
  } catch { return response({ ok: false, error: "Unable to prepare upload. Check the file limits and try again." }, 400); }
}
