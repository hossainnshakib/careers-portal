import Link from "next/link";

export function PublicHeader() {
  return <header data-testid="public-header" className="public-header">
    <div className="ui-container w-full pt-5">
      <div className="ui-glass flex flex-wrap items-center justify-between gap-4 rounded-[28px] py-2.5 pl-[22px] pr-3 sm:rounded-full">
        <Link href="/" className="flex items-center gap-[9px] text-[19px] font-extrabold tracking-[-.02em]">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-ui-blue" />Careers
        </Link>
        <nav aria-label="Careers navigation" className="order-3 flex w-full justify-center gap-7 pb-1 text-[14px] font-semibold text-ui-chip sm:order-none sm:w-auto sm:pb-0">
          <Link href="/#roles">Roles</Link><Link href="/#how">How it works</Link><Link href="/#faq">FAQ</Link>
        </nav>
        <Link href="/#roles" className="rounded-full bg-ui-ink px-5 py-[11px] text-[14px] font-bold text-white">Browse roles</Link>
      </div>
    </div>
  </header>;
}
