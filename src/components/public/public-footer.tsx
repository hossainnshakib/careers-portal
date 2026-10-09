import Link from "next/link";
import type { PublicBrand } from "@/lib/careers/filters";
import { publicWebsite } from "@/lib/careers/presentation";

export function PublicFooter({ brands, contactEmail }: { brands: PublicBrand[]; contactEmail?: string }) {
  return <footer className="mt-16 bg-ink text-background">
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:grid-cols-2">
      <div><p className="text-xl font-black tracking-tight">Careers<span className="text-poster">.</span></p>
        <p className="mt-3 leading-relaxed">Good work starts with a conversation.</p>
        <p className="mt-3">{contactEmail ? <a className="underline" href={`mailto:${contactEmail}`}>{contactEmail}</a> : "Contact email to be confirmed."}</p>
      </div>
      <div className="space-y-4"><nav aria-label="Brand websites" className="flex flex-wrap gap-x-5 gap-y-3 font-bold">
        {brands.map(brand => { const href = publicWebsite(brand.website); return href ? <a key={brand.id} href={href} target="_blank" rel="noopener noreferrer" className="underline">{brand.name}</a> : null; })}
      </nav><Link href="/privacy" className="inline-block font-bold underline">Privacy</Link></div>
    </div>
  </footer>;
}
