const LOGO_SCALE: Record<string, number> = {
  "fixen-media": 0.8, builtale: 1.05, doshok: 1.05, accoraze: 1.12,
  "wiki-bangla": 1.05, "ghora-fera": 1.1, mactie: 1.05, avagata: 1.05,
};

/** Passive image rendering only; never inline brand-provided SVG markup. */
export function PublicBrandLogo({ name, src, slug, className = "h-[22px] max-w-[110px]", decorative = false }: {
  name: string; src: string | null; slug?: string; className?: string; decorative?: boolean;
}) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={decorative ? "" : `${name} logo`}
      title={decorative ? undefined : name}
      width={110}
      height={36}
      className={`shrink-0 object-contain ${className}`}
      style={{ transform: `scale(${LOGO_SCALE[slug ?? ""] ?? 1})` }}
      loading="lazy"
    />
  );
}
