"use client";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <section role="alert" className="admin-card admin-empty">
      <h1 className="admin-state-heading">Unable to load this page</h1>
      <p className="admin-muted">Please try again.</p>
      <button className="admin-btn" onClick={reset}>
        Retry
      </button>
    </section>
  );
}
