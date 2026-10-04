"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="text-2xl font-semibold">We couldn’t load this page.</h1>
      <button
        onClick={reset}
        className="mt-5 rounded-lg bg-primary px-5 py-3 text-primary-foreground"
      >
        Try again
      </button>
    </main>
  );
}
