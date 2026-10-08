import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { applicationAnswers, jobQuestions } from "@/db/schema";

/** One left join preserves archived/missing questions and immutable answer fields. */
export async function loadDisplayAnswers(applicationId: string) {
  const rows = await getDb().select({ answer: applicationAnswers, questionOptions: jobQuestions.options })
    .from(applicationAnswers).leftJoin(jobQuestions, eq(jobQuestions.id, applicationAnswers.questionId))
    .where(eq(applicationAnswers.applicationId, applicationId)).orderBy(asc(applicationAnswers.sortOrder));
  return rows.map(({ answer, questionOptions }) => ({ ...answer, questionOptions }));
}
