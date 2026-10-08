// Synthetic layout diagnostics only; never loads credentials or applicant data.
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { CandidateProfile } from "../src/lib/pdf/CandidateProfile";
import type { PdfModel } from "../src/lib/pdf/model";
const model: PdfModel = { reference: "APP-234567", fullName: "Synthetic Example", email: "fixture@example.com", phone: "01700000000", location: "Dhaka", title: "Test role", brands: ["Test brand"], department: "Test department", primaryBrand: "Test brand", status: "new", appliedAt: new Date().toISOString(), generatedAt: new Date().toISOString(), timezone: "UTC", locale: "en-GB", accent: "#30303B", answers: [], attachments: [], notes: [] };
type LayoutNode = { type: string; props?: { fixed?: boolean; render?: unknown }; style?: { fontFamily?: string; fontSize?: number }; box?: Record<string, number>; lines?: { box: unknown }[]; value?: string; children?: LayoutNode[] };
const document = CandidateProfile({ model });
await renderToBuffer(React.cloneElement(document, { onRender: (result: { _INTERNAL__LAYOUT__DATA_?: LayoutNode }) => {
  function inspect(node: LayoutNode, parentTop = 0) {
    const top = parentTop + (node.box?.top ?? 0);
    if (node.type === "PAGE" || node.props?.fixed || node.props?.render) console.info(JSON.stringify({ type: node.type, absoluteTop: top, box: node.box, style: node.style, children: node.props?.render ? node.children?.map((child) => ({ type: child.type, length: child.value?.length })) : undefined, lines: node.lines?.map((line) => line.box) }));
    node.children?.forEach((child) => inspect(child, top));
  }
  if (result._INTERNAL__LAYOUT__DATA_) inspect(result._INTERNAL__LAYOUT__DATA_);
} }));
