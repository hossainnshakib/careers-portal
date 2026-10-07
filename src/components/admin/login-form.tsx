"use client";

import { useEffect, useState } from "react";
import { login } from "@/app/admin/login/actions";

export function LoginForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <form
      method="post"
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (pending) return;
        const form = new FormData(event.currentTarget);
        const passwordField =
          event.currentTarget.querySelector<HTMLInputElement>('input[name="password"]');
        if (passwordField) passwordField.value = "";
        setPending(true);
        setError("");
        try {
          const result = await login({ email: form.get("email"), password: form.get("password") });
          if (result.ok) {
            window.location.replace("/admin/mfa");
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
      <fieldset disabled={!ready || pending} className="space-y-4">
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
      </fieldset>
    </form>
  );
}
