import { describe, expect, it } from "vitest";

const enabled = process.env.RUN_SUPABASE_TESTS === "1";
describe.skipIf(!enabled)("dev Auth configuration", () => {
  it("keeps public sign-ups disabled", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Auth configuration checks require the dev Supabase URL and anon key.");
    const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("Unable to read Auth settings.");
    const settings = (await response.json()) as { disable_signup?: unknown };
    expect(
      settings.disable_signup,
      "Set 'Enable sign-ups' to OFF for this project (Supabase dashboard, Authentication > Sign In / Providers). AGENTS.md requires sign-ups to be disabled.",
    ).toBe(true);
  }, 30000);
});
