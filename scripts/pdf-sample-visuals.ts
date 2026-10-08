// Credentials-free screenshots for owner review; PDFs stay outside the repository.
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
const folder = "C:/Users/Hossa/AppData/Local/Temp/opencode";
const browser = await chromium.launch({ channel: "chromium" });
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1500 } });
  for (const [label, last] of [["english", false], ["bengali", false], ["long-answers", false], ["long-answers", true], ["many-answers", false], ["many-answers", true]] as const) {
    const bytes = await readFile(`${folder}/candidate-sample-${label}.pdf`);
    const number = last ? (bytes.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length : 1;
    await page.goto(`file:///${folder}/candidate-sample-${label}.pdf#page=${number}`);
    await page.waitForTimeout(1800); // Native PDF viewer paint, not an application assertion.
    if (number > 1) { await page.mouse.click(700, 600); await page.keyboard.press("Control+End"); await page.waitForTimeout(500); }
    await page.screenshot({ path: `${folder}/candidate-sample-${label}-page-${number}.png` });
  }
  console.info("Six PDF comparison screenshots generated in the approved temporary directory.");
} finally { await browser.close(); }
