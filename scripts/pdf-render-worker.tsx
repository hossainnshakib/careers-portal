// Credentials-free PDF renderer worker. Data arrives only over private IPC.
import React from "react";
import { writeFile } from "node:fs/promises";
import { renderToBuffer } from "@react-pdf/renderer";
import { CandidateProfile } from "../src/lib/pdf/CandidateProfile";
import type { PdfModel } from "../src/lib/pdf/model";

process.on("message", (message: { label: string; model: PdfModel }) => {
  void (async () => {
    if (!["english", "bengali", "long-answers", "many-answers"].includes(message.label)) throw new Error("Invalid PDF sample label");
    const bytes = await renderToBuffer(<CandidateProfile model={message.model} />);
    const pages = (bytes.toString("latin1").match(/\/Type \/Page\b/g) ?? []).length;
    await writeFile(`C:/Users/Hossa/AppData/Local/Temp/opencode/candidate-sample-${message.label}.pdf`, bytes);
    process.send?.({ type: "rendered", pages });
  })().catch(() => process.send?.({ type: "error" }));
});
