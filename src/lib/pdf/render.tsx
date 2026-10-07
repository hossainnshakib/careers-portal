import "server-only";

import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import type { loadPdfProfile } from "@/db/queries/pdf";
import { CandidateProfile } from "./CandidateProfile";
import { buildPdfModel } from "./model-server";
export async function renderProfilePdf(profile: NonNullable<Awaited<ReturnType<typeof loadPdfProfile>>>, timezone: string, locale: string) {
  return renderToBuffer(<CandidateProfile model={await buildPdfModel(profile, timezone, locale)} />);
}
