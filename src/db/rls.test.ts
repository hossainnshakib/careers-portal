import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const enabled = process.env.RUN_SUPABASE_TESTS === "1";
describe.skipIf(!enabled)("anon RLS integration", () => {
  it.each([
    "departments",
    "brands",
    "jobs",
    "job_brands",
    "job_questions",
    "applications",
    "application_answers",
    "attachments",
    "admin_notes",
    "application_status_events",
    "admin_users",
  ])("cannot read %s", async (table) => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("RLS checks require dev Supabase URL and anon key.");
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { count, error } = await client.from(table).select("*", { head: true, count: "exact" });
    // Only recognized permission denials are acceptable; network/schema errors must fail.
    if (error) expect(error.code).toBe("42501");
    else expect(count).toBe(0);
  });
});
