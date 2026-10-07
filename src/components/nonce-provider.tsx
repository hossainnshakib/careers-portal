"use client";
import { createContext, useContext, useState } from "react";
const NonceContext = createContext<string | undefined>(undefined);
export function NonceProvider({ nonce, children }: { nonce: string | undefined; children: React.ReactNode }) {
  const [documentNonce] = useState(nonce);
  return <NonceContext.Provider value={documentNonce}>{children}</NonceContext.Provider>;
}
export function useDocumentNonce() { return useContext(NonceContext); }
