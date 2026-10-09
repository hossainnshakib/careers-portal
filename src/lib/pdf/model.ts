export type PdfModel = {
  reference: string; fullName: string; email: string; phone: string; location: string;
  title: string; brands: string[]; department: string; primaryBrand: string;
  status: string; appliedAt: string; generatedAt: string; timezone: string; locale: string;
  accent: string; logo?: string;
  answers: { label: string; type: string; section: string; value: unknown; optionsSnapshot?: unknown; questionOptions?: unknown }[];
  attachments: { id: string; name: string; size: number; kind: string }[];
  notes: { note: string; author: string; createdAt: string }[];
};
export function pdfText(value: string) {
  // Explicit breaks keep long tokens inside the column; clickable URI targets
  // are kept separately, so the renderer cannot insert misleading URL hyphens.
  return value.replace(/[^\s]{80,}/gu, (word) => {
    const graphemes = [...new Intl.Segmenter("bn", { granularity: "grapheme" }).segment(word)].map((item) => item.segment);
    return graphemes.map((part, i) => part + ((i + 1) % 40 === 0 ? "\n" : "")).join("");
  });
}
export function pdfDate(iso: string, model: Pick<PdfModel, "timezone" | "locale">) {
  return new Intl.DateTimeFormat(model.locale, { timeZone: model.timezone, dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}
