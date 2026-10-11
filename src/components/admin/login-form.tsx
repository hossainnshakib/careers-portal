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
      className="admin-stack"
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
      <fieldset disabled={!ready || pending} className="admin-stack">
        <label>
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            maxLength={254}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            maxLength={256}
          />
        </label>
        <p role="status" aria-live="polite" className="admin-error">
          {error}
        </p>
        <button
          className="admin-btn"
          disabled={pending}
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </fieldset>
    </form>
  );
}
