import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { missingPdfTraceAssets, missingTraceDisposition, pdfTracePath } from "../src/lib/pdf/trace-guard";

try {
  const path = resolve(pdfTracePath);
  if (!existsSync(path)) {
    if (missingTraceDisposition(existsSync(".next/BUILD_ID"), process.argv.includes("--require-build")) === "fail")
      throw new Error("Built PDF route trace is missing.");
    console.info("SKIP PDF trace guard: no build output. Run pnpm build.");
  } else {
    const trace = JSON.parse(readFileSync(path, "utf8")) as { files?: unknown };
    const logos = readdirSync("public/brands").filter(name => /\.(svg|png|webp)$/i.test(name));
    const missing = missingPdfTraceAssets(trace.files, logos);
    if (missing.length) throw new Error(`Missing traced assets: ${missing.join("; ")}.`);
    console.info(`PASS PDF trace guard: Helvetica/chunks/ICC, both Bengali fonts and ${logos.length} logos.`);
  }
} catch (error) {
  console.error(`FAIL PDF trace guard: ${error instanceof Error ? error.message : "Invalid build trace."}`);
  process.exitCode = 1;
}
