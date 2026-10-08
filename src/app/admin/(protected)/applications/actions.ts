"use server";

import { revalidatePath } from "next/cache";
import { AdminAccessError, requireAdmin } from "@/lib/auth/requireAdmin";
import { addReviewNote, changeReviewStatus, deleteReviewApplication, deleteReviewNote } from "@/db/queries/review";
import { deleteApplicationInput, deleteNoteInput, noteInput, statusInput } from "@/lib/validation/review";
import type { ActionResult } from "@/lib/actions/result";

function invalidate(id: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${id}`);
}
function failure(error: unknown): ActionResult {
  return { ok: false, error: error instanceof AdminAccessError ? "Administrator access required." : "Unable to update application. Refresh and try again." };
}
export async function changeStatusAction(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = statusInput.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Choose a valid application status." };
    await changeReviewStatus(parsed.data.applicationId, parsed.data.status, admin.userId);
    invalidate(parsed.data.applicationId);
    return { ok: true, data: null };
  } catch (error) { return failure(error); }
}
export async function addNoteAction(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = noteInput.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Write a note up to 10,000 characters." };
    await addReviewNote(parsed.data.applicationId, parsed.data.note, admin);
    invalidate(parsed.data.applicationId);
    return { ok: true, data: null };
  } catch (error) { return failure(error); }
}
export async function deleteNoteAction(input: unknown): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = deleteNoteInput.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Invalid note request." };
    await deleteReviewNote(parsed.data.applicationId, parsed.data.noteId, admin.userId);
    invalidate(parsed.data.applicationId);
    return { ok: true, data: null };
  } catch (error) { return failure(error); }
}
export async function deleteApplicationAction(input: unknown): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = deleteApplicationInput.safeParse(input);
    if (!parsed.success) return { ok: false, error: "Confirm application deletion first." };
    await deleteReviewApplication(parsed.data.applicationId);
    invalidate(parsed.data.applicationId);
    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, error: error instanceof AdminAccessError ? "Administrator access required." : "Deletion could not finish. Retry deletion to restore retained files or finish temporary-file cleanup." };
  }
}
