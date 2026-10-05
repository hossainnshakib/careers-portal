import { describe, expect, it } from "vitest";
import { validateBrandLogo, validateSvg } from "./brand-logo";

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><title>Logo</title><defs><linearGradient id="a"><stop offset="0" stop-color="#fff"/></linearGradient></defs><path fill="url(#a)" d="M0 0h10v10z"/></svg>';
describe("brand logo validation", () => {
  it("accepts passive shape SVG with local gradient references", () => {
    expect(validateSvg(svg)).toBe(true);
    expect(validateSvg(`<?xml version="1.0"?><!-- logo -->${svg}`)).toBe(true);
    const bytes = new TextEncoder().encode(svg);
    expect(
      validateBrandLogo({ name: "logo.SVG", type: "image/svg+xml", size: bytes.length }, bytes),
    ).toEqual({ extension: "svg", mime: "image/svg+xml" });
  });
  it.each([
    "<svg><script>alert(1)</script></svg>",
    '<svg onload="alert(1)"></svg>',
    "<svg><foreignObject/></svg>",
    '<svg><image href="https://example.com/x"/></svg>',
    '<svg><use href="javascript:alert(1)"/></svg>',
    '<svg><path fill="url(https://example.com/x)"/></svg>',
    '<svg style="background:url(javascript:alert(1))"/>',
    '<svg><style>@import "https://example.com";</style></svg>',
    '<!DOCTYPE svg [<!ENTITY x "test">]><svg/>',
    '<svg xmlns="http://www.w3.org/1999/xhtml"/>',
    '<svg><path href="&#106;avascript:alert(1)"/></svg>',
    '<svg><animate attributeName="href"/></svg>',
    '<svg><path onclick = "alert(1)"/></svg>',
    "<svg/><svg/>",
    "<svg><path></svg>",
    '<svg><path fill="red" fill="blue"/></svg>',
    "<svg><path fill=red /></svg>",
    "<svg><?other instruction?></svg>",
    "<svg><g><svg/></g></svg>",
  ])("rejects active, external or malformed SVG case %#", (source) =>
    expect(validateSvg(source)).toBe(false),
  );
  it("enforces size, MIME/extension agreement and UTF-8", () => {
    const bytes = new TextEncoder().encode(svg);
    for (const file of [
      { name: "x.png", type: "image/svg+xml", size: bytes.length },
      { name: "x.svg", type: "text/html", size: bytes.length },
      { name: "x.svg", type: "image/svg+xml", size: 1024 * 1024 + 1 },
      { name: "x.svg", type: "image/svg+xml", size: 0 },
      { name: "x.svg", type: "image/svg+xml", size: bytes.length + 1 },
    ])
      expect(() => validateBrandLogo(file, bytes)).toThrow();
    expect(() =>
      validateBrandLogo({ name: "x.svg", type: "image/svg+xml", size: 1 }, new Uint8Array([255])),
    ).toThrow("UTF-8");
  });
  it("checks PNG/WebP signatures rather than trust metadata", () => {
    const png = new Uint8Array(24);
    png.set([137, 80, 78, 71, 13, 10, 26, 10]);
    png.set(new TextEncoder().encode("IHDR"), 12);
    expect(
      validateBrandLogo({ name: "x.png", type: "image/png", size: png.length }, png).extension,
    ).toBe("png");
    const webp = new TextEncoder().encode("RIFFxxxxWEBPVP8 ");
    expect(
      validateBrandLogo({ name: "x.webp", type: "image/webp", size: webp.length }, webp).extension,
    ).toBe("webp");
    for (const [name, type] of [
      ["x.png", "image/png"],
      ["x.webp", "image/webp"],
    ])
      expect(() => validateBrandLogo({ name, type, size: 24 }, new Uint8Array(24))).toThrow();
  });
});
