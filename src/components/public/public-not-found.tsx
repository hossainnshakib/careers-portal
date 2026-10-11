import Link from "next/link";

export function PublicNotFound() {
  return <main id="main" className="mx-auto max-w-[820px] px-6 py-12"><div className="ui-glass rounded-[28px] p-7 sm:p-10">
    <p className="ui-label text-ui-blue-text">404</p><h1 className="mt-3 text-[34px] font-extrabold tracking-[-.03em]">This page isn’t available.</h1>
    <p className="mt-5 leading-relaxed text-ui-muted">The link may be incorrect, or this role may not be available publicly.</p>
    <Link href="/#roles" className="ui-button mt-7">Browse open roles</Link>
  </div></main>;
}
