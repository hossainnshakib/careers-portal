import { accentColor } from "@/lib/careers/presentation";
import { readableAccentText } from "@/lib/brands/contrast";

/**
 * A brand logo in a circle. Falls back to the accent-coloured initial letter
 * when the brand has no uploaded logo, exactly like the admin mockups.
 *
 * `alt` is only set where the surrounding screen-reader text would otherwise
 * lose the brand name (the brand cards); inside tables the name is announced
 * as nearby sr-only text instead, so every mark stays decorative.
 */
export function BrandMark({
  name,
  logoUrl,
  accentColor: accent,
  size = "sm",
  alt,
  initialsOnly = false,
}: {
  name: string;
  logoUrl?: string | null;
  accentColor?: string | null;
  size?: "sm" | "lg";
  alt?: string;
  initialsOnly?: boolean;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const className = `admin-brand-mark${logoUrl && !initialsOnly ? " has-logo" : ""}${size === "lg" ? " is-lg" : ""}`;
  if (logoUrl && !initialsOnly) {
    return (
      <span className={className} aria-hidden={alt ? undefined : true}>
        {/* SVG brand assets must remain passive img elements. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={alt ?? ""} />
      </span>
    );
  }
  const circle = (
    <span
      className={className}
      aria-hidden="true"
      style={{ background: accentColor(accent), color: readableAccentText(accentColor(accent)) }}
    >
      {initial}
    </span>
  );
  return alt ? (
    <>
      {circle}
      <span className="sr-only">{alt}</span>
    </>
  ) : (
    circle
  );
}

/** Several marks in a row; each brand name is available to screen readers. */
export function BrandMarks({
  brands,
  size = "sm",
  initialsOnly = false,
}: {
  brands: { id?: string; name: string; logoUrl?: string | null; accentColor?: string | null }[];
  size?: "sm" | "lg";
  initialsOnly?: boolean;
}) {
  if (!brands.length) return null;
  return (
    <span className="admin-brand-marks">
      {brands.map((brand, index) => (
        <span key={brand.id ?? `${brand.name}:${index}`} style={{ display: "inline-flex", alignItems: "center" }}>
          <BrandMark name={brand.name} logoUrl={brand.logoUrl} accentColor={brand.accentColor} size={size} initialsOnly={initialsOnly} />
          <span className="sr-only">{brand.name}</span>
        </span>
      ))}
    </span>
  );
}
