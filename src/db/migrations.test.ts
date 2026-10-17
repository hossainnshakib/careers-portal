import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { expect, it } from "vitest";

const folder = "src/db/migrations";
const journal = JSON.parse(readFileSync(`${folder}/meta/_journal.json`, "utf8"));
it("the real Drizzle reader includes the forward correction, never the unjournaled historical UPDATE", () => {
  const files = readMigrationFiles({ migrationsFolder: folder });
  expect(files).toHaveLength(7);
  const correction = files.at(-1)!;
  expect(correction.sql.join("\n")).toContain('ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_salary_range_text_check"');
  expect(correction.sql.join("\n")).not.toMatch(/\b(UPDATE|DELETE|DROP|INSERT)\b/);
  expect(correction.hash).toBe(createHash("sha256").update(readFileSync(`${folder}/0007_enforce_salary_range_text.sql`)).digest("hex"));
  expect(journal.entries.at(-1).tag).toBe("0007_enforce_salary_range_text");
});
it("keeps journal timestamps ordered and accounts for every SQL file except the documented historic orphan", () => {
  const entries = journal.entries as { tag: string; when: number }[];
  expect(entries.every((entry, i) => i === 0 || entry.when > entries[i - 1].when)).toBe(true);
  const registered = new Set(entries.map(entry => `${entry.tag}.sql`));
  expect(readdirSync(folder).filter(file => file.endsWith(".sql") && !registered.has(file))).toEqual(["0006_fix_salary_mode_text.sql"]);
  const latest = JSON.parse(readFileSync(`${folder}/meta/0007_snapshot.json`, "utf8"));
  const previous = JSON.parse(readFileSync(`${folder}/meta/0005_snapshot.json`, "utf8"));
  expect(latest.prevId).toBe(previous.id);
  expect(latest.tables["public.jobs"].checkConstraints.jobs_salary_range_text_check).toBeDefined();
});
