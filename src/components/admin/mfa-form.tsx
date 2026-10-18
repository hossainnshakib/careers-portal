"use client";

import { useEffect, useRef, useState } from "react";
import { enrollMfaAction, verifyMfaAction } from "@/app/admin/mfa/actions";

export function MfaForm({ factors }: { factors: { id: string; name: string }[] }) {
  const [factorId, setFactorId] = useState(factors[0]?.id ?? "");
  const [setup, setSetup] = useState<{ qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  function enterDigits(index: number, raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 6 - index);
    if (!digits && index === 0) { setCode(""); return; }
    setCode((current) => {
      const next = current.padEnd(6, " ").split("");
      next[index] = " ";
      for (let i = 0; i < digits.length; i++) next[index + i] = digits[i];
      return next.join("").trimEnd();
    });
    if (digits) digitRefs.current[Math.min(5, index + digits.length)]?.focus();
  }
  return <section className="admin-stack">
    <h1 className="admin-kicker">{setup || !factorId ? "Set up two-step" : "Enter code"}</h1>
    {!factorId && <form method="post" onSubmit={async (event) => {
      event.preventDefault(); if (!ready || pending) return; const capturedPassword = password; setPassword(""); setPending(true); setMessage("");
      try { const result = await enrollMfaAction({ password: capturedPassword }); if (result.ok) { setFactorId(result.data.factorId); setSetup(result.data); } else setMessage(result.error); }
      catch { setMessage("Unable to start enrollment."); } finally { setPending(false); }
    }} className="admin-stack">
      <fieldset disabled={!ready || pending} className="admin-stack admin-fieldset">
      <p className="admin-note">Install an authenticator app, then scan the QR code and verify its six-digit code.</p>
      <label>Administrator password<input aria-label="Administrator password" type="password" required maxLength={256} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <button disabled={pending || !password} className="admin-btn">Set up authenticator</button>
      </fieldset>
    </form>}
    {setup && <><div className="admin-mfa-qr">
      {/* QR SVG is trusted Auth output and is displayed as an image, never inline markup. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={setup.qr} alt="Authenticator enrollment QR code" width={220} height={220} />
    </div></>}
    {factorId && <form method="post" onSubmit={async (event) => {
      event.preventDefault(); if (!ready || pending) return; setPending(true); setMessage(""); const submitted = code; setCode("");
      try { const result = await verifyMfaAction({ factorId, code: submitted }); if (result.ok) { setSetup(null); window.location.replace("/admin"); } else setMessage(result.error); }
      catch { setMessage("Unable to verify authenticator."); } finally { setPending(false); }
    }} className="admin-stack">
      <fieldset disabled={!ready || pending} className="admin-stack admin-fieldset">
      {factors.length > 1 && <label>Authenticator<select aria-label="Authenticator" value={factorId} onChange={(event) => { setFactorId(event.target.value); setCode(""); }}>{factors.map((factor) => <option key={factor.id} value={factor.id}>{factor.name}</option>)}</select></label>}
      <div className="admin-digits">
        {Array.from({ length: 6 }, (_, index) => (
          <input
            key={index}
            ref={(element) => { digitRefs.current[index] = element; }}
            className="admin-digit"
            aria-label={index === 0 ? "Authenticator code" : `Authenticator code digit ${index + 1}`}
            value={code[index]?.trim() ?? ""}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={index === 0 ? 6 : 1}
            disabled={pending}
            onChange={(event) => enterDigits(index, event.target.value)}
            onPaste={(event) => { event.preventDefault(); enterDigits(index, event.clipboardData.getData("text")); }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !code[index]?.trim() && index > 0) digitRefs.current[index - 1]?.focus();
              if (event.key === "ArrowLeft" && index > 0) digitRefs.current[index - 1]?.focus();
              if (event.key === "ArrowRight" && index < 5) digitRefs.current[index + 1]?.focus();
            }}
          />
        ))}
      </div>
      <button disabled={pending || !/^\d{6}$/.test(code)} className="admin-btn">{setup ? "Verify" : "Continue"}</button>
      </fieldset>
    </form>}
    <p role="status" aria-live="polite" className="admin-error">{message}</p>
    <details className="admin-auth-help"><summary>{setup ? "Setup key and recovery" : "Lost your authenticator?"}</summary>
      {setup && <><p className="admin-note">Or enter this setup key in your authenticator:</p><code data-testid="mfa-setup-key" className="admin-mfa-key">{setup.secret}</code></>}
      <p className="admin-note">If you lose your authenticator, contact the portal owner for manual account recovery. Password-only access cannot bypass this check.</p>
    </details>
  </section>;
}
