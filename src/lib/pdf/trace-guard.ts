export const pdfTracePath = ".next/server/app/api/admin/applications/[id]/pdf/route.js.nft.json";

/** Trace filenames only: never reads a profile or PDF body. */
export function missingPdfTraceAssets(files: unknown, logos: string[]): string[] {
  if (!Array.isArray(files) || !files.every(file => typeof file === "string")) throw new Error("Invalid PDF trace file list.");
  const paths = files.map(file => file.replaceAll("\\", "/"));
  const contains = (suffix: string) => paths.some(file => file === suffix || file.endsWith(`/${suffix}`));
  const checks: [string, boolean][] = [
    ["pdfkit Helvetica standard font module", contains("pdfkit/js/standard-fonts/Helvetica.cjs")],
    ["pdfkit standard-font dependency chunks", paths.some(file => /\/pdfkit\/js\/standard-fonts\/chunks\/.*\.cjs$/.test(file))],
    ["pdfkit sRGB ICC profile", contains("pdfkit/js/data/sRGB_IEC61966_2_1.icc")],
    ["static Bengali Regular font", contains("assets/fonts/HindSiliguri-Regular.ttf")],
    ["static Bengali Bold font", contains("assets/fonts/HindSiliguri-Bold.ttf")],
    ...logos.map(name => [`static brand logo ${name}`, contains(`public/brands/${name}`)] as [string, boolean]),
  ];
  if (!logos.length) checks.push(["static brand logo inventory", false]);
  return checks.filter(([, present]) => !present).map(([label]) => label);
}
export function missingTraceDisposition(hasBuild: boolean, requireBuild: boolean): "skip" | "fail" {
  return hasBuild || requireBuild ? "fail" : "skip";
}
