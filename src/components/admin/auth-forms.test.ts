import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("@/app/admin/login/actions", () => ({ login: vi.fn() }));
vi.mock("@/app/admin/mfa/actions", () => ({ enrollMfaAction: vi.fn(), verifyMfaAction: vi.fn() }));
import { AdminAuthFrame } from "./admin-auth-frame";
import { LoginForm } from "./login-form";
import { MfaForm } from "./mfa-form";

it("retains labelled login/password bounds and a disabled pre-hydration fieldset inside the glass auth frame", () => {
  const html = renderToStaticMarkup(createElement(AdminAuthFrame, null, createElement(LoginForm)));
  expect(html).toContain("Careers admin"); expect(html).toContain('class="admin-card admin-auth-card"');
  expect(html).toContain('<fieldset disabled=""'); expect(html).toContain('autoComplete="username"');
  expect(html).toContain('autoComplete="current-password"'); expect(html).toContain('maxLength="256"');
  expect(html).toContain('role="status" aria-live="polite"'); expect(html).toContain("Sign in");
});
it("keeps the mandatory password re-verification gate and owner-only recovery without exposing a setup key before enrollment", () => {
  const html = renderToStaticMarkup(createElement(MfaForm, { factors: [] }));
  expect(html).toContain('<h1 class="admin-kicker">Set up two-step</h1>');
  expect(html).toContain('aria-label="Administrator password"'); expect(html).toContain('maxLength="256"');
  expect(html).toContain("Set up authenticator"); expect(html).toContain("manual account recovery");
  expect(html).toContain("Password-only access cannot bypass this check.");
  expect(html).not.toContain("mfa-setup-key"); expect(html).not.toContain("<img");
  expect(html).toContain('class="admin-auth-help"><summary>Lost your authenticator?');
  expect(html).toContain('<fieldset disabled=""');
});
it("renders exactly six challenge cells, one labelled heading, autofill/paste capacity and Continue disabled until a complete hydrated code", () => {
  const html = renderToStaticMarkup(createElement(MfaForm, { factors: [{ id: "synthetic-factor", name: "Authenticator" }] }));
  expect([...html.matchAll(/class="admin-digit"/g)]).toHaveLength(6);
  expect([...html.matchAll(/<h1/g)]).toHaveLength(1);
  expect(html).toContain("Enter code"); expect(html).not.toContain("Verify setup");
  expect(html).toContain('aria-label="Authenticator code"'); expect(html).toContain('aria-label="Authenticator code digit 6"');
  expect(html).toContain('autoComplete="one-time-code" maxLength="6"');
  expect(html).toContain('disabled="" class="admin-btn">Continue');
  expect(html).not.toContain("Administrator password");
});
it("preserves selection when an administrator owns more than one authenticator", () => {
  const html = renderToStaticMarkup(createElement(MfaForm, { factors: [{ id: "first", name: "First factor" }, { id: "second", name: "Second factor" }] }));
  expect(html).toContain('aria-label="Authenticator"'); expect(html).toContain("First factor"); expect(html).toContain("Second factor");
});
