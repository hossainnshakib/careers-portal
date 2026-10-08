import "server-only";

import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { loadPdfProfile } from "@/db/queries/pdf";
import { CandidateProfile } from "./CandidateProfile";
import { buildPdfModel } from "./model-server";

/** Bounds the download request only; the answer budget bounds the render itself. */
const renderTimeoutMs = 30_000;

export async function renderProfilePdf(profile: NonNullable<Awaited<ReturnType<typeof loadPdfProfile>>>, timezone: string, locale: string) {
  const rendered = renderToBuffer(<CandidateProfile model={await buildPdfModel(profile, timezone, locale)} />);
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      rendered,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("Profile PDF rendering timed out")), renderTimeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    // A render that loses the race keeps running; it must not surface later.
    rendered.catch(() => undefined);
  }
}
