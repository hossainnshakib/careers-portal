type BrandLogoProps = {
  name: string;
  src: string | null;
  className?: string;
};

export function BrandLogo({ name, src, className = "" }: BrandLogoProps) {
  return (
    <div
      className={`flex h-24 w-full items-center justify-center rounded-lg bg-white p-4 ${className}`}
    >
      {src ? (
        // SVGs deliberately use img: never inline untrusted logo markup.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${name} logo`}
          width={240}
          height={96}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="text-sm font-semibold text-neutral-900">{name}</span>
      )}
    </div>
  );
}
