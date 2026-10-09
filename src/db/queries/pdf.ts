import "server-only";

import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { applications, attachments, adminNotes, brands } from "@/db/schema";
import { loadDisplayAnswers } from "./application-answers";

export async function loadPdfProfile(id: string, includeNotes: boolean) {
  const db = getDb();
  const [application] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  if (!application) return null;
  const answers = await loadDisplayAnswers(id);
  const files = await db.select().from(attachments).where(eq(attachments.applicationId, id)).orderBy(asc(attachments.createdAt));
  const notes = includeNotes ? await db.select().from(adminNotes).where(eq(adminNotes.applicationId, id)).orderBy(desc(adminNotes.createdAt)) : [];
  const primaryBrands = await db.select({ accent: brands.accentColor, logo: brands.logoUrl }).from(brands).where(eq(brands.name, application.primaryBrandSnapshot)).limit(2);
  // The schema snapshots a name, not a brand UUID; never substitute a different
  // current primary brand when the historic name no longer matches uniquely.
  return { application, answers, files, notes, brand: primaryBrands.length === 1 ? primaryBrands[0] : null };
}
