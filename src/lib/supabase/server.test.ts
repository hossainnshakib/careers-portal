import { expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ options: null as unknown, set: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => [], set: state.set }) }));
vi.mock("@/lib/env-public", () => ({ getPublicEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://preview.example.test", NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-public" }) }));
vi.mock("@supabase/ssr", () => ({ createServerClient: (_url: string, _key: string, options: unknown) => { state.options = options; return {}; } }));
import { createSupabaseServerClient } from "./server";
it("normalizes every SDK write including deletes using the shared policy", async () => {
  await createSupabaseServerClient();
  const options = state.options as { cookieOptions: { maxAge: number }; cookies: { setAll: (values: object[]) => void } };
  expect(options.cookieOptions.maxAge).toBe(2592000);
  options.cookies.setAll([{ name: "sb-example-auth-token.0", value: "synthetic-token", options: { maxAge: 400 * 86400 } }, { name: "sb-example-auth-token.1", value: "", options: { maxAge: 0 } }]);
  expect(state.set).toHaveBeenCalledWith("sb-example-auth-token.0", "synthetic-token", expect.objectContaining({ maxAge: 2592000, httpOnly: true, secure: true, path: "/" }));
  expect(state.set).toHaveBeenCalledWith("sb-example-auth-token.1", "", expect.objectContaining({ maxAge: 0, httpOnly: true }));
});
