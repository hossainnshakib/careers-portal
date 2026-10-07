"use client";

import { useState } from "react";
import { enrollMfaAction, verifyMfaAction } from "@/app/admin/mfa/actions";

export function MfaForm({ factors }: { factors: { id: string; name: string }[] }) {
  const [factorId, setFactorId] = useState(factors[0]?.id ?? "");
  const [setup, setSetup] = useState<{ qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return <section className="space-y-5 rounded border border-border bg-card p-5">
    {!factorId && <><p>Install an authenticator app, then scan the QR code and verify its six-digit code.</p><button disabled={pending} className="rounded border border-border p-3" onClick={async () => {
      setPending(true); setMessage("");
      try { const result = await enrollMfaAction({}); if (result.ok) { setFactorId(result.data.factorId); setSetup(result.data); } else setMessage(result.error); }
      catch { setMessage("Unable to start enrollment."); } finally { setPending(false); }
    }}>Set up authenticator</button></>}
    {setup && <><div className="flex justify-center bg-white p-4">
      {/* QR SVG is trusted Auth output and is displayed as an image, never inline markup. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={setup.qr} alt="Authenticator enrollment QR code" width={220} height={220} />
    </div><p className="text-sm">Or enter this setup key in your authenticator:</p><code data-testid="mfa-setup-key" className="block break-all rounded bg-secondary p-3">{setup.secret}</code></>}
    {factorId && <form method="post" onSubmit={async (event) => {
      event.preventDefault(); setPending(true); setMessage(""); const submitted = code; setCode("");
      try { const result = await verifyMfaAction({ factorId, code: submitted }); if (result.ok) { setSetup(null); window.location.replace("/admin"); } else setMessage(result.error); }
      catch { setMessage("Unable to verify authenticator."); } finally { setPending(false); }
    }} className="space-y-4">
      {factors.length > 1 && <label>Authenticator<select aria-label="Authenticator" value={factorId} onChange={(event) => setFactorId(event.target.value)}>{factors.map((factor) => <option key={factor.id} value={factor.id}>{factor.name}</option>)}</select></label>}
      <label>Authenticator code<input aria-label="Authenticator code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="one-time-code" inputMode="numeric" maxLength={6} className="mt-2 block w-full rounded border border-input p-3" /></label>
      <button disabled={pending || code.length !== 6} className="rounded bg-primary px-5 py-3 text-primary-foreground disabled:opacity-50">Verify authenticator</button>
    </form>}
    <p role="status" aria-live="polite">{message}</p>
    <p className="text-sm text-muted-foreground">If you lose your authenticator, contact the portal owner for manual account recovery. Password-only access cannot bypass this check.</p>
  </section>;
}
