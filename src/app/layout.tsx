import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { headers } from "next/headers";
import { NonceProvider } from "@/components/nonce-provider";

const latin = localFont({
  src: "../../assets/fonts/Inter-Variable.ttf",
  variable: "--font-latin",
  display: "swap",
  weight: "100 900",
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
  title: "Careers",
  description: "Discover opportunities across our brands.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en">
      <body className={`${latin.variable} ${bengali.variable} antialiased`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:block focus:p-4">
          Skip to content
        </a>
        <NonceProvider nonce={nonce}>{children}</NonceProvider>
      </body>
    </html>
  );
}
