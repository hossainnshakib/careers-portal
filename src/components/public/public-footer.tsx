import Link from "next/link";
import type { PublicBrand } from "@/lib/careers/filters";
import { publicWebsite } from "@/lib/careers/presentation";

export function PublicFooter({ brands, contactEmail }: { brands: PublicBrand[]; contactEmail?: string }) {
  return <footer className="ui-container w-full pb-10 pt-14">
    <div className="flex flex-wrap justify-between gap-6 border-t border-ui-border pt-7 text-[14px] text-ui-muted">
      <div className="space-y-1.5">
        <p className="text-[17px] font-extrabold text-ui-ink">Careers</p>
        <p>Good work starts with a conversation.</p>
        {contactEmail && <a className="inline-block underline underline-offset-4" href={`mailto:${contactEmail}`}>{contactEmail}</a>}
      </div>
      <nav aria-label="Brand websites" className="flex flex-wrap items-start gap-x-[22px] gap-y-3 font-semibold text-ui-ink">
        {brands.map(brand => { const href = publicWebsite(brand.website); return href ? <a key={brand.id} href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{brand.name}</a> : null; })}
        <Link href="/privacy" className="underline underline-offset-4">Privacy</Link>
      </nav>
    </div>
  </footer>;
}
