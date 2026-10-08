import "server-only";

import { fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import { closeDb } from "../src/db";
import { requireDevTarget } from "../src/db/seed/require-dev";
import { demoPdfSampleIds } from "../src/db/queries/pdf-samples";
import { loadPdfProfile } from "../src/db/queries/pdf";
import { buildPdfModel } from "../src/lib/pdf/model-server";
import type { PdfModel } from "../src/lib/pdf/model";

async function main() {
  requireDevTarget();
  const ids = await demoPdfSampleIds();
  const english = await loadPdfProfile(ids.english, false);
  const bengali = await loadPdfProfile(ids.bengali, false);
  if (!english || !bengali) throw new Error("Demo sample missing");
  const base = await buildPdfModel(bengali, "Asia/Dhaka", "en-GB");
  const cases: Record<string, PdfModel> = {
    english: await buildPdfModel(english, "Asia/Dhaka", "en-GB"), bengali: base,
    "long-answers": { ...base, answers: [
      { label: "Long Bengali answer", type: "long_text", section: "professional", value: "শ্রীময়ীর কর্মক্ষেত্রে গবেষণা ও সৃজনশীল প্রকল্পের অভিজ্ঞতা রয়েছে। ".repeat(120) },
      { label: "Very long URL", type: "url", section: "portfolio", value: `https://example.com/${"portfolio".repeat(160)}` },
    ], notes: [{ note: "Explicitly included synthetic note.", author: "fixture@example.com", createdAt: new Date().toISOString() }] },
    "many-answers": { ...base, answers: Array.from({ length: 80 }, (_, i) => ({ label: `Question ${i + 1}`, type: "long_text", section: ["professional", "experience", "skills", "portfolio", "role_specific"][i % 5], value: "A detailed example of relevant work, collaboration and thoughtful delivery. ".repeat(5) })) },
  };
  const env: NodeJS.ProcessEnv = { NODE_ENV: "production", PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP, TMP: process.env.TMP };
  const worker = fork(fileURLToPath(new URL("./pdf-render-worker.tsx", import.meta.url)), [], { execArgv: ["--import", "tsx"], env, stdio: ["ignore", "ignore", "ignore", "ipc"] });
  try {
    for (const [label, model] of Object.entries(cases)) {
      const pages = await new Promise<number>((resolve, reject) => {
        const timeout = setTimeout(() => { worker.off("message", receive); reject(new Error("PDF sample timed out")); }, 60000);
        function receive(message: unknown) {
          clearTimeout(timeout); worker.off("message", receive);
          if (message && typeof message === "object" && "type" in message && message.type === "rendered" && "pages" in message) resolve(Number(message.pages));
          else reject(new Error("PDF sample rendering failed"));
        }
        worker.on("message", receive); worker.send({ label, model });
      });
      console.info(JSON.stringify({ sample: label, pages }));
    }
  } finally { worker.kill(); }
}
main().catch(() => { console.error("Dev PDF sample generation failed. No applicant details were logged."); process.exitCode = 1; }).finally(closeDb);
