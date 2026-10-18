import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { DemoNotice } from "./demo-notice";
import { demoDisclaimer, isDemoSlug } from "@/lib/demo";

it("renders a prominent exact disclaimer for demos and ephemeral tests, never actual roles", () => {
  for (const slug of ["demo-platform-developer", `e2e-${"a".repeat(32)}-public`]) {
    expect(isDemoSlug(slug)).toBe(true);
    expect(renderToStaticMarkup(createElement(DemoNotice, { slug }))).toContain(demoDisclaimer);
  }
  expect(renderToStaticMarkup(createElement(DemoNotice, { slug: "web-developer" }))).toBe("");
});
