"use server";

import { redirect } from "next/navigation";
import { existingSessionApplication, insertApplication, withUploadSession } from "@/db/queries/applications";
import { loadApplicationJob } from "@/db/queries/public-jobs";
import { verifyUploadSession } from "@/lib/upload-session";
import { verifyTurnstile } from "@/lib/turnstile";
import { applicationInputSchema, validateApplicationAnswers } from "@/lib/validation/application";
import { moveApplicationFile, restoreApplicationFiles, verifyUploadedFile } from "@/lib/storage/application-files";
import type { Reservation } from "@/lib/validation/uploads";
import type { ActionResult } from "@/lib/actions/result";

export async function submitApplication(input: unknown): Promise<ActionResult<never>> {
  let reference: string;
  let sessionId: string | undefined;
  const moved: Reservation[] = [];
  try {
    const parsed = applicationInputSchema.safeParse(input);
    if (!parsed.success || parsed.data.honeypot) return { ok: false, error: "Check your application fields and try again." };
    const data = parsed.data;
    if (!(await verifyTurnstile(data.turnstileToken))) return { ok: false, error: "Complete the security check and try again." };
    const session = verifyUploadSession(data.sessionToken, data.jobSlug);
    sessionId = session.id;
    if (Date.now() - session.issuedAt < 3000) return { ok: false, error: "Take a moment to check your answers, then submit again." };
    reference = await withUploadSession(session.id, async (tx) => {
      verifyUploadSession(data.sessionToken, data.jobSlug);
      const existing = await existingSessionApplication(tx, session.id);
      if (existing) return existing.reference;
      const definition = await loadApplicationJob(data.jobSlug, tx);
      if (!definition || definition.job.status !== "open" || (definition.job.deadlineAt && definition.job.deadlineAt.getTime() <= Date.now()) || !definition.brands.some((b) => b.brand.status === "active")) throw new Error("Job unavailable");
      const validated = validateApplicationAnswers(definition.questions, data.answers, data.cv, definition.job.cvRequired);
      const files: Reservation[] = [];
      for (const file of validated.files) files.push(await verifyUploadedFile(session, file.id, file.slot, definition.questions));
      for (const file of files) { await moveApplicationFile(file); moved.push(file); }
      return insertApplication(tx, { id: session.id, contact: data.contact, definition, answers: validated.answers, files });
    });
  } catch {
    if (moved.length && sessionId) {
      try {
        // A lost commit acknowledgement must never cause committed attachments
        // to be moved away. Reacquire the session lock before recovery/retries.
        const committed = await withUploadSession(sessionId, async (tx) => {
          const existing = await existingSessionApplication(tx, sessionId!);
          if (existing) return existing.reference;
          await restoreApplicationFiles(moved);
          return null;
        });
        if (committed) reference = committed;
        else return { ok: false, error: "Unable to submit application. Your uploads were restored; check your answers and try again." };
      } catch { return { ok: false, error: "Unable to finalize application. Start a fresh application and upload your files again." }; }
    } else return { ok: false, error: "Unable to submit application. Check that the role is open, required answers are complete and uploads have finished." };
  }
  redirect(`/applied/${reference}`);
}
