import { accentColor } from "@/lib/careers/presentation";

export function BrandDot({ color }: { color: string | null | undefined }) {
  return <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: accentColor(color) }} />;
}
