"use client";

import Link from "next/link";

export default function PublicError({ reset }: { reset: () => void }) {
  return <main id="main" className="mx-auto max-w-[820px] px-6 py-12"><div className="ui-glass rounded-[28px] p-7 sm:p-10">
    <h1 className="text-[34px] font-extrabold tracking-[-.03em]">We couldn’t load this page.</h1>
    <p className="mt-4 text-ui-muted">Please try again, or return to the open roles.</p>
    <div className="mt-6 flex flex-wrap items-center gap-5"><button onClick={reset} className="ui-button">Try again</button><Link href="/#roles" className="font-semibold text-ui-blue-text underline">Back to roles</Link></div>
  </div></main>;
}
