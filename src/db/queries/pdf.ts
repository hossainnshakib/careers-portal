import "server-only";

import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { applications, applicationAnswers, attachments, adminNotes, brands } from "@/db/schema";

export async function loadPdfProfile(id: string, includeNotes: boolean) {
  const db = getDb();
  const [application] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  if (!application) return null;
  const [answers, files, notes, primaryBrands] = await Promise.all([
    db.select().from(applicationAnswers).where(eq(applicationAnswers.applicationId, id)).orderBy(asc(applicationAnswers.sortOrder)),
    db.select().from(attachments).where(eq(attachments.applicationId, id)).orderBy(asc(attachments.createdAt)),
    includeNotes ? db.select().from(adminNotes).where(eq(adminNotes.applicationId, id)).orderBy(desc(adminNotes.createdAt)) : Promise.resolve([]),
    db.select({ accent: brands.accentColor, logo: brands.logoUrl }).from(brands).where(eq(brands.name, application.primaryBrandSnapshot)).limit(2),
  ]);
  // The schema snapshots a name, not a brand UUID; never substitute a different
  // current primary brand when the historic name no longer matches uniquely.
  return { application, answers, files, notes, brand: primaryBrands.length === 1 ? primaryBrands[0] : null };
}
