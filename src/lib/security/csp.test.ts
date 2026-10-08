import { expect, it } from "vitest";
import { createCsp } from "./csp";
it("enforces nonce-based scripts, exact Supabase/Turnstile origins and frame/object restrictions", () => {
  const csp = createCsp("testNonce123", "https://dev.supabase.co", false);
  expect(csp).toContain("'nonce-testNonce123'"); expect(csp).toContain("frame-ancestors 'none'"); expect(csp).toContain("object-src 'none'");
  expect(csp).toContain("https://dev.supabase.co"); expect(csp).toContain("https://challenges.cloudflare.com");
  expect(csp.split(";").find((part) => part.trim().startsWith("script-src"))).not.toContain("unsafe-inline"); expect(csp).not.toContain("unsafe-eval");
  expect(() => createCsp("'; injected", null, false)).toThrow();
  expect(createCsp("nonce", null, true)).toContain("unsafe-eval");
});
