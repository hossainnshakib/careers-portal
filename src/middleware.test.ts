import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const state = vi.hoisted(() => ({ writes: true }));
vi.mock("@/lib/env-public", () => ({ getPublicEnv: () => ({ NEXT_PUBLIC_SITE_URL: "https://preview.example.test", NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic" }), getSecurityEnvironment: () => ({ supabaseOrigin: "https://example.supabase.co", development: false }) }));
vi.mock("@supabase/ssr", () => ({ createServerClient: (_url: string, _key: string, options: { cookies: { setAll: (values: object[], headers: object) => void } }) => ({ auth: { getUser: async () => {
  if (state.writes) {
    options.cookies.setAll([{ name: "sb-example-auth-token.0", value: "synthetic-first", options: { maxAge: 400 * 86400 } }], { "Cache-Control": "private, no-store" });
    options.cookies.setAll([{ name: "sb-example-auth-token.1", value: "synthetic-second", options: { maxAge: 400 * 86400 } }, { name: "sb-example-auth-token.2", value: "", options: { maxAge: 0 } }], {});
  }
  return { data: { user: { id: "synthetic-user" } }, error: null };
} } }) }));
import { middleware } from "./middleware";
beforeEach(() => { state.writes = true; });
it("preserves all refreshed chunks across repeated SDK callbacks and keeps clear operations", async () => {
  const response = await middleware(new NextRequest("https://preview.example.test/admin"));
  expect(response.cookies.get("sb-example-auth-token.0")?.value).toBe("synthetic-first");
  expect(response.cookies.get("sb-example-auth-token.1")?.maxAge).toBe(2592000);
  expect(response.cookies.get("sb-example-auth-token.2")?.maxAge).toBe(0);
  expect(response.headers.get("cache-control")).toContain("no-store");
});
it("slides persistent expiry on authenticated activity without minting/replacing a token", async () => {
  state.writes = false;
  const response = await middleware(new NextRequest("https://preview.example.test/admin", { headers: { cookie: "sb-example-auth-token.0=synthetic-existing" } }));
  expect(response.cookies.get("sb-example-auth-token.0")?.value).toBe("synthetic-existing");
  expect(response.cookies.get("sb-example-auth-token.0")?.maxAge).toBe(2592000);
});
