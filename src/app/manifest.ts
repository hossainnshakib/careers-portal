import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "@/lib/env-public";

export default function manifest(): MetadataRoute.Manifest {
  const origin = getPublicSiteUrl();
  return {
    name: "Careers",
    short_name: "Careers",
    description: "Browse open roles across our brands. No account needed.",
    start_url: origin,
    display: "standalone",
    background_color: "#f2f5fb",
    theme_color: "#f2f5fb",
    icons: [
      { src: `${origin}/icon.svg`, sizes: "any", type: "image/svg+xml" },
      { src: `${origin}/apple-icon.png`, sizes: "180x180", type: "image/png" },
    ],
  };
}
