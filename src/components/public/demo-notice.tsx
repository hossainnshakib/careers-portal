import { demoDisclaimer, isDemoSlug } from "@/lib/demo";

export function DemoNotice({ slug }: { slug: string }) {
  return isDemoSlug(slug) ? <p className="rounded-xl border-2 border-amber-700 bg-amber-50 p-3 text-sm font-extrabold text-amber-950" data-testid="demo-notice">{demoDisclaimer}. Synthetic identities and files only.</p> : null;
}
