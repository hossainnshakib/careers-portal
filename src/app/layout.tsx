import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { headers } from "next/headers";
import { NonceProvider } from "@/components/nonce-provider";
import { getPublicSiteUrl } from "@/lib/env-public";

const latin = localFont({
  src: "../../assets/fonts/Inter-Variable.ttf",
  variable: "--font-latin",
  display: "swap",
  weight: "100 900",
  preload: false,
});
const bengali = localFont({
  src: [
    { path: "../../assets/fonts/HindSiliguri-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../assets/fonts/HindSiliguri-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-bengali",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(getPublicSiteUrl()),
  title: "Careers",
  description: "Browse open roles across our brands. No account needed.",
  openGraph: { title: "Careers", description: "Good work starts here. Browse open roles across our brands.", siteName: "Careers", type: "website" },
  twitter: { card: "summary" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en">
      <body className={`${latin.variable} ${bengali.variable} antialiased`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:block focus:p-4" style={{ fontFamily: "system-ui, sans-serif" }}>
          Skip to content
        </a>
        <NonceProvider nonce={nonce}>{children}</NonceProvider>
      </body>
    </html>
  );
}
