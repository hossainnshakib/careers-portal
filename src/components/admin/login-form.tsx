"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/admin/login/actions";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending) return;
        const form = new FormData(event.currentTarget);
        setPending(true);
        setError("");
        try {
          const result = await login({ email: form.get("email"), password: form.get("password") });
          if (result.ok) {
            router.replace("/admin");
            router.refresh();
          } else {
            setError(result.error);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } catch {
          setError("Unable to sign in. Please try again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <label className="block">
        Email
        <input
          className="mt-1 block w-full rounded border border-input p-2"
          name="email"
          type="email"
          required
          autoComplete="username"
          maxLength={254}
        />
      </label>
      <label className="block">
        Password
        <input
          className="mt-1 block w-full rounded border border-input p-2"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          maxLength={256}
        />
      </label>
      <p role="status" aria-live="polite" className="text-sm text-destructive">
        {error}
      </p>
      <button
        className="w-full rounded bg-primary px-4 py-3 text-primary-foreground disabled:opacity-60"
        disabled={pending}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
