import { z } from "zod";

const metadata = z.strictObject({
  name: z.string().min(1).max(255),
  type: z.enum(["image/svg+xml", "image/png", "image/webp"]),
  size: z
    .number()
    .int()
    .positive()
    .max(1024 * 1024),
});
const extensions = { "image/svg+xml": "svg", "image/png": "png", "image/webp": "webp" } as const;
const elements = new Set([
  "svg",
  "g",
  "path",
  "rect",
  "circle",
  "ellipse",
  "line",
  "polyline",
  "polygon",
  "defs",
  "linearGradient",
  "radialGradient",
  "stop",
  "clipPath",
  "mask",
  "title",
  "desc",
]);
const attributes = new Set([
  "xmlns",
  "version",
  "viewBox",
  "width",
  "height",
  "id",
  "x",
  "y",
  "x1",
  "x2",
  "y1",
  "y2",
  "cx",
  "cy",
  "r",
  "rx",
  "ry",
  "d",
  "points",
  "fill",
  "fill-rule",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-opacity",
  "opacity",
  "transform",
  "clip-path",
  "clip-rule",
  "mask",
  "maskUnits",
  "maskContentUnits",
  "gradientUnits",
  "gradientTransform",
  "offset",
  "stop-color",
  "stop-opacity",
  "preserveAspectRatio",
  "spreadMethod",
]);

/** Fail closed on active/unknown XML rather than attempt to repair hostile SVG. */
export function validateSvg(source: string): boolean {
  const xml = source
    .replace(/^\uFEFF/, "")
    .replace(/^\s*<\?xml\s+[^?]*\?>/, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();
  if (
    !xml ||
    /[&\u0000-\u0008\u000B\u000C\u000E-\u001F]|<!|<\?|javascript\s*:|data\s*:|\\/i.test(xml)
  )
    return false;
  const stack: string[] = [];
  let cursor = 0;
  let rootSeen = false;
  const tags = /<([^<>]+)>/g;
  for (const match of xml.matchAll(tags)) {
    const between = xml.slice(cursor, match.index);
    if (
      between.includes("<") ||
      between.includes(">") ||
      (between.trim() && !["title", "desc"].includes(stack.at(-1) ?? ""))
    )
      return false;
    cursor = match.index + match[0].length;
    const raw = match[1];
    if (raw.startsWith("/")) {
      const close = /^\/([A-Za-z][\w-]*)\s*$/.exec(raw);
      if (!close || stack.pop() !== close[1]) return false;
      continue;
    }
    const tag = /^([A-Za-z][\w-]*)([\s\S]*?)(\/?)$/.exec(raw);
    if (!tag || !elements.has(tag[1])) return false;
    if (stack.length === 0) {
      if (rootSeen || tag[1] !== "svg") return false;
      rootSeen = true;
    } else if (tag[1] === "svg") return false;
    let attrs = tag[2];
    const seen = new Set<string>();
    while (attrs.trim()) {
      const attr = /^\s+([A-Za-z][\w:-]*)\s*=\s*(?:"([^"<>]*)"|'([^'<>]*)')/.exec(attrs);
      if (!attr || !attributes.has(attr[1]) || seen.has(attr[1])) return false;
      seen.add(attr[1]);
      const value = attr[2] ?? attr[3];
      if (attr[1] === "xmlns" && value !== "http://www.w3.org/2000/svg") return false;
      // Paint/clip references may target only IDs within this document.
      if (/url\s*\(/i.test(value) && !/^url\(#[A-Za-z_][\w.-]*\)$/.test(value)) return false;
      attrs = attrs.slice(attr[0].length);
    }
    if (!tag[3]) stack.push(tag[1]);
  }
  return rootSeen && stack.length === 0 && !xml.slice(cursor).trim();
}

export function validateBrandLogo(
  file: { name: string; type: string; size: number },
  bytes: Uint8Array,
) {
  const parsed = metadata.safeParse(file);
  if (!parsed.success || bytes.byteLength !== file.size)
    throw new Error("Invalid logo type or size");
  const extension = extensions[parsed.data.type];
  if (file.name.split(".").at(-1)?.toLowerCase() !== extension)
    throw new Error("Logo extension must match MIME type");
  if (extension === "svg") {
    let source: string;
    try {
      source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      throw new Error("SVG must be UTF-8");
    }
    if (!validateSvg(source)) throw new Error("SVG contains unsupported or unsafe content");
  } else if (extension === "png") {
    if (
      bytes.length < 24 ||
      ![137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value) ||
      String.fromCharCode(...bytes.slice(12, 16)) !== "IHDR"
    )
      throw new Error("Invalid PNG signature");
  } else if (
    bytes.length < 16 ||
    String.fromCharCode(...bytes.slice(0, 4)) !== "RIFF" ||
    String.fromCharCode(...bytes.slice(8, 12)) !== "WEBP" ||
    !["VP8 ", "VP8L", "VP8X"].includes(String.fromCharCode(...bytes.slice(12, 16)))
  )
    throw new Error("Invalid WebP signature");
  return { extension, mime: parsed.data.type };
}
