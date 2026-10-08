"use client";

import { useState } from "react";
import { logout } from "@/app/admin/login/actions";

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <button
        className="rounded border border-border px-4 py-2 disabled:opacity-60"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError("");
          try {
            const result = await logout();
            if (result.ok) {
              window.location.replace("/admin/login");
            } else setError(result.error);
          } catch {
            setError("Unable to sign out. Try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      <p role="status" className="mt-2 text-sm text-destructive">
        {error}
      </p>
    </div>
  );
}
