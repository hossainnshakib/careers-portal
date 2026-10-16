// Render only the supplied static HTML/CSS; never execute design-tool scripts.
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const source = "design/mockup/careers-admin-mockups";
const destination = "design/mockup-reference-admin";
const font = async (file) => (await fs.readFile(file)).toString("base64");
const latin = await font("node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2");
const bengali = await font("node_modules/@fontsource/hind-siliguri/files/hind-siliguri-bengali-400-normal.woff2");
const bengaliBold = await font("node_modules/@fontsource/hind-siliguri/files/hind-siliguri-bengali-600-normal.woff2");
const fonts = `@font-face{font-family:'Plus Jakarta Sans';src:url(data:font/woff2;base64,${latin});font-weight:200 800}@font-face{font-family:'Hind Siliguri';src:url(data:font/woff2;base64,${bengali});font-weight:400}@font-face{font-family:'Hind Siliguri';src:url(data:font/woff2;base64,${bengaliBold});font-weight:500 800}`;
await fs.mkdir(destination, { recursive: true });
const browser = await chromium.launch();
try {
  for (const file of (await fs.readdir(source)).filter((name) => name.endsWith(".html"))) {
    const original = await fs.readFile(path.join(source, file), "utf8");
    const css = original.match(/<style>([\s\S]*?)<\/style>/)?.[1];
    const body = original.split("</helmet>")[1]?.split("</x-dc>")[0];
    if (!css || !body) throw new Error("Missing static board markup");
    for (const width of [1440, 390]) {
      const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
      await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${fonts}${css}</style></head><body>${body}</body></html>`);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: path.join(destination, `${file.replace(".dc.html", "")}-${width}.png`), fullPage: true });
      await page.close();
    }
  }
} finally {
  await browser.close();
}
console.log("Rendered 14 static admin boards at 1440 and 390; screenshots are ignored.");
