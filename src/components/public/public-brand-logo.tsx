/** Passive image rendering only; never inline brand-provided SVG markup. */
export function PublicBrandLogo({ name, src, className = "h-[17px] w-[43px]", decorative = false }: {
  name: string; src: string | null; className?: string; decorative?: boolean;
}) {
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={decorative ? "" : `${name} logo`} width={100} height={40} className={`shrink-0 object-contain ${className}`} loading="lazy" />;
}
