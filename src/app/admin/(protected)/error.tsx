"use client";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <section role="alert">
      <h1 className="text-xl font-bold">Unable to load this page</h1>
      <p className="my-3">Please try again.</p>
      <button className="rounded border border-border px-4 py-2" onClick={reset}>
        Retry
      </button>
    </section>
  );
}
