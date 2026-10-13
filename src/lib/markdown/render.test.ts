import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { SafeMarkdown } from "./render";

it("renders Markdown while discarding HTML and unsafe URL protocols", () => {
  // This fixture carries the markdown edge cases (bold, list, safe/unsafe link,
  // attempted raw HTML) once seeded demo content was made realistic; the
  // sanitiser guarantees live here, not in user-facing demo text.
  const html = renderToStaticMarkup(
    createElement(SafeMarkdown, {
      text: "**Bold**\n\n- Item\n\n[safe](https://example.com)\n\n[unsafe](javascript:alert)\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>",
    }),
  );
  expect(html).toContain("<strong>Bold</strong>");
  expect(html).toContain("<li>Item</li>");
  expect(html).toContain('href="https://example.com"');
  expect(html).not.toMatch(/<script|<img|onerror|javascript:/i);
});
