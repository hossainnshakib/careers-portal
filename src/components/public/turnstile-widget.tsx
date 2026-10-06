"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { getPublicEnv } from "@/lib/env-public";

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: { sitekey: string; action: string; callback: (token: string) => void; "expired-callback": () => void; "error-callback": () => void }) => string;
      remove: (id: string) => void;
    };
  }
}
export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!ready || !container.current || !window.turnstile) return;
    const id = window.turnstile.render(container.current, {
      sitekey: getPublicEnv().NEXT_PUBLIC_TURNSTILE_SITE_KEY, action: "careers", callback: onToken,
      "expired-callback": () => onToken(""), "error-callback": () => { onToken(""); setFailed(true); },
    });
    return () => { window.turnstile?.remove(id); };
  }, [ready, onToken]);
  return <div><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={() => setReady(true)} onError={() => setFailed(true)} />
    <div ref={container} aria-label="Security check" />{failed && <p role="alert">Security check could not load. Refresh the page to try again.</p>}</div>;
}
