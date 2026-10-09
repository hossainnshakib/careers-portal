import Link from "next/link";

export function PublicHeader() {
  return <header className="border-b border-border">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-6">
      <Link href="/" className="text-xl font-black tracking-tight">Careers<span className="text-poster">.</span></Link>
      <nav aria-label="Careers navigation" className="flex gap-5 font-bold sm:gap-8">
        <Link href="/#roles">Roles</Link><Link href="/#how-it-works">How it works</Link><Link href="/#faq">FAQ</Link>
      </nav>
    </div>
  </header>;
}
