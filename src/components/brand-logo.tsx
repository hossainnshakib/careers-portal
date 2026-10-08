type BrandLogoProps = {
  name: string;
  src: string | null;
  className?: string;
  slug?: string;
  size?: "default" | "strip" | "mark" | "tiny";
  decorative?: boolean;
};

const logoScale: Record<string, number> = {
  "fixen-media": 0.8, builtale: 1.05, doshok: 1.05, accoraze: 1.12,
  "wiki-bangla": 1.05, "ghora-fera": 1.1, mactie: 1.05, avagata: 1.05,
};
const boxes = {
  default: "h-24 w-full p-4", strip: "h-16 w-32 p-2",
  mark: "h-8 w-20 p-1", tiny: "h-6 w-16 p-1",
};

export function BrandLogo({ name, src, slug, size = "default", decorative = false, className = "" }: BrandLogoProps) {
  return (
    <div
      aria-hidden={decorative || undefined}
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ${boxes[size]} ${className}`}
    >
      {src ? (
        // SVGs deliberately use img: never inline untrusted logo markup.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={decorative ? "" : `${name} logo`}
          width={240}
          height={96}
          className="h-full w-full object-contain"
          style={{ transform: `scale(${logoScale[slug ?? ""] ?? 1})` }}
        />
      ) : (
        !decorative && <span className="font-bold text-neutral-900">{name}</span>
      )}
    </div>
  );
}
