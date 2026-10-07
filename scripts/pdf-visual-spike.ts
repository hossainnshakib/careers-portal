// Credentials-free comparison images in the approved temporary directory.
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const folder = "C:/Users/Hossa/AppData/Local/Temp/opencode";
const browser = await chromium.launch({ channel: "chromium" });
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1500 } });
  await page.goto(`file:///${folder}/bengali-spike.pdf`);
  await page.waitForTimeout(2500); // Permit the native PDF viewer to finish rasterizing.
  await page.screenshot({ path: `${folder}/bengali-pdf.png` });
  const regular = (await readFile(fileURLToPath(new URL("../assets/fonts/HindSiliguri-Regular.ttf", import.meta.url)))).toString("base64");
  const bold = (await readFile(fileURLToPath(new URL("../assets/fonts/HindSiliguri-Bold.ttf", import.meta.url)))).toString("base64");
  await page.setContent(`<style>@font-face{font-family:Hind;src:url(data:font/ttf;base64,${regular})}@font-face{font-family:Hind;src:url(data:font/ttf;base64,${bold});font-weight:700}body{font-family:Hind;font-size:24px;padding:36px;max-width:700px}p{margin:18px 0}</style><h2>Bengali reference — Chromium</h2>${[
    "ক্ষ ঞ্জ দ্ব স্ত্র ন্ধ শ্রী",
    "শ্রীময়ী দত্ত — কর্মক্ষেত্রে গবেষণা ও সৃজনশীল প্রকল্পে আমার অভিজ্ঞতা রয়েছে।",
    "শিক্ষার্থী, দৃষ্টিভঙ্গি, বন্ধুত্ব, জ্ঞান, স্বাধীনতা, স্ত্রী, শ্রদ্ধা",
    "বাংলা ও English mixed text: শ্রী ক্ষিতিশ, Web Developer, Dhaka 2026.",
  ].map((text) => `<p>${text}<br><strong>${text}</strong></p>`).join("")}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${folder}/bengali-reference.png`, fullPage: true });
  console.info("PDF and Chromium comparison screenshots generated in the approved temporary directory.");
} finally { await browser.close(); }
