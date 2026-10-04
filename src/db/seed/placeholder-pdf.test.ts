import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

it("generates the Latin-only demo attachment through the actual CLI worker", () => {
  const buffer = execFileSync(
    process.execPath,
    ["--import", "tsx", fileURLToPath(new URL("./placeholder-pdf.ts", import.meta.url))],
    { timeout: 15_000 },
  );
  expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  expect(buffer.toString("ascii")).toContain("/Type /Page");
  expect(buffer.subarray(-20).toString("ascii")).toContain("%%EOF");
});
