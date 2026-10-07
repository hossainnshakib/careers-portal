import "server-only";
import { createHash } from "node:crypto";
import { and, asc, inArray, like } from "drizzle-orm";
import { getDb } from "@/db";
import { applications } from "@/db/schema";
import { requireDevTarget } from "@/db/seed/require-dev";

export async function demoPdfSampleIds() {
  requireDevTarget();
  const ids = Array.from({ length: 30 }, (_, i) => {
    const hex = createHash("sha256").update(`careers-demo:app-${i}`).digest("hex");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  });
  const rows = await getDb().select({ id: applications.id, name: applications.fullName }).from(applications)
    .where(and(inArray(applications.id, ids), like(applications.email, "demo-%@example.com"))).orderBy(asc(applications.reference));
  const names = new Set(["শাকিব আহমেদ", "শ্রীময়ী দত্ত", "নন্দিতা চৌধুরী", "ঋত্বিক সেন", "মোস্তফা রহমান", "অঞ্জনা বিশ্বাস", "Alex Example", "Sam Example", "Taylor Example", "Jordan Example"]);
  const demo = rows.filter((row) => names.has(row.name));
  const bengali = demo.find((row) => /[\u0980-\u09ff]/.test(row.name));
  const english = demo.find((row) => !/[\u0980-\u09ff]/.test(row.name));
  if (!english || !bengali) throw new Error("Unedited demo applicants required for PDF samples");
  return { english: english.id, bengali: bengali.id };
}
