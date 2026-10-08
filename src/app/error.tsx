"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="text-2xl font-semibold">We couldn’t load this page.</h1>
      <p className="mt-4 text-muted-foreground">Please try again, or return to the open roles.</p>
      <button
        onClick={reset}
        className="mt-5 rounded-lg bg-primary px-5 py-3 text-primary-foreground"
      >
        Try again
      </button>
      <Link href="/" className="ml-5 inline-block underline">Back to roles</Link>
    </main>
  );
}
