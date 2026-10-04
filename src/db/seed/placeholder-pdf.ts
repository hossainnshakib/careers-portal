// Credentials-free CLI worker. Run WITHOUT react-server conditions.
import { createElement } from "react";
import { Document, Page, Text, renderToBuffer } from "@react-pdf/renderer";

const buffer = await renderToBuffer(
  createElement(
    Document,
    {},
    createElement(
      Page,
      { size: "A4" },
      createElement(Text, {}, "Demo CV - placeholder only. No real applicant data."),
    ),
  ),
);
process.stdout.write(buffer);
