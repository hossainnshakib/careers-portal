import { createHash } from "node:crypto";
import { eq, isNull, and } from "drizzle-orm";
import { afterAll, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getDb, closeDb } from "@/db";
import { applications, applicationAnswers, jobQuestions, jobs } from "@/db/schema";
import { requireDevTarget } from "./require-dev";
import { seedDemo } from "./demo";

afterAll(closeDb);
it.skipIf(process.env.RUN_SUPABASE_TESTS !== "1")(
  "demo upgrade preserves every existing application/snapshot and is idempotent",
  async () => {
    requireDevTarget();
    const db = getDb();
    async function snapshot() {
      const apps = await db.select().from(applications).orderBy(applications.id);
      const answers = await db.select().from(applicationAnswers).orderBy(applicationAnswers.id);
      return createHash("sha256").update(JSON.stringify({ apps, answers })).digest("hex");
    }
    const before = await snapshot();
    await seedDemo();
    expect((await snapshot()) === before).toBe(true);
    const first = (await db.select().from(jobQuestions).orderBy(jobQuestions.id)).map((q) => ({
      ...q,
      createdAt: q.createdAt.toISOString(),
      archivedAt: q.archivedAt?.toISOString() ?? null,
    }));
    await seedDemo();
    const second = (await db.select().from(jobQuestions).orderBy(jobQuestions.id)).map((q) => ({
      ...q,
      createdAt: q.createdAt.toISOString(),
      archivedAt: q.archivedAt?.toISOString() ?? null,
    }));
    expect(JSON.stringify(first) === JSON.stringify(second)).toBe(true);
    expect((await snapshot()) === before).toBe(true);
    const [web] = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.slug, "web-developer"));
    const active = await db
      .select({ type: jobQuestions.type })
      .from(jobQuestions)
      .where(and(eq(jobQuestions.jobId, web.id), isNull(jobQuestions.archivedAt)));
    expect(new Set(active.map((q) => q.type)).size).toBe(11);
  },
  180000,
);
