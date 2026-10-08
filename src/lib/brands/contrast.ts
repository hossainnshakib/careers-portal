import { accentColor } from "@/lib/careers/presentation";

function luminance(color: string) {
  const hex = accentColor(color).slice(1);
  const channels = [0, 2, 4].map(index => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}
export function contrastRatio(first: string, second: string) {
  const a = luminance(first); const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
/** Black/white guarantee >=4.5 for every valid sRGB accent, including mid-grey. */
export function readableAccentText(color: string | null | undefined): "#000000" | "#ffffff" {
  const background = accentColor(color);
  return contrastRatio(background, "#000000") >= contrastRatio(background, "#ffffff") ? "#000000" : "#ffffff";
}
/** Preserve historical names; ambiguous or renamed branding gets neutral colour. */
export function snapshotAccent(name: string, brands: { name: string; accentColor: string | null }[]) {
  const matches = brands.filter(brand => brand.name === name);
  return matches.length === 1 ? accentColor(matches[0].accentColor) : accentColor(null);
}
