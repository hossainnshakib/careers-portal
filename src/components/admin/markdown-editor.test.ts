import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { MarkdownEditor } from "./markdown-editor";

it.each(["Description", "Responsibilities", "Requirements", "Nice to have"])("starts %s in Write mode with accessible buttons, intact escaped text and validated limit", (label) => {
  const html = renderToStaticMarkup(createElement(MarkdownEditor, { label, value: "বাংলা <script>alert(1)</script>", onChange: () => {}, description: label === "Description" }));
  expect(html).toContain(`aria-label="${label} mode"`);
  expect(html).toContain('aria-pressed="true">Write</button>');
  expect(html).toContain('aria-pressed="false">Preview</button>');
  expect(html).toContain('maxLength="50000"');
  expect(html).toContain("বাংলা &lt;script&gt;");
  expect(html).not.toContain("<script>");
  expect(html).not.toContain(`aria-label="${label} preview"`);
  expect(html).toContain(`rows="${label === "Description" ? 4 : 3}"`);
});
