import { PublicBrandLogo } from "./public-brand-logo";

export type LogoRowBrand = { id: string; name: string; slug: string; logoUrl: string | null };

/**
 * One horizontal row of brand logos: never wraps, never stacks, never overlaps.
 *
 * - a fixed row height (28px on cards, 30px inside hero chips, 34px on the
 *   "Who you would work with" cards) keeps every logo on one vertical band;
 * - each logo box (and each chip around it) is `flex: 0 1 auto` with
 *   `min-width: 0`, so wide sets shrink proportionally inside the card padding
 *   instead of wrapping to a new line or spilling past a narrow viewport;
 * - at most three marks are shown (primary first) plus a "+N" chip; the hidden
 *   names stay reachable through accessible text and the chip's title tooltip;
 * - brand names are never visible, only in alt/title text.
 */
export function BrandLogoRow({ brands, size = 28, chip = false, ariaLabel, className = "" }: {
  brands: LogoRowBrand[];
  /** Rendered logo height in px. */
  size?: number;
  /** Wrap every logo in a white rounded chip (Job/Apply "Hiring for" rows). */
  chip?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  const shown = brands.slice(0, 3);
  const hidden = brands.slice(shown.length);
  const hiddenNames = hidden.map(brand => brand.name).join(", ");
  // Chips carry 3px vertical padding, so the chip row is 6px taller than a logo.
  const rowHeight = chip ? size + 6 : size;
  const overflow = hidden.length > 0 && (
    <span
      className="flex h-full shrink-0 items-center rounded-full border border-ui-border bg-white/80 px-2 text-[12px] font-bold text-ui-muted"
      title={hiddenNames}
    >
      +{hidden.length}
      <span className="sr-only"> more brands: {hiddenNames}</span>
    </span>
  );
  return (
    <div
      data-testid="brand-logo-row"
      role={ariaLabel ? "group" : undefined}
      aria-label={ariaLabel}
      className={`flex min-w-0 flex-nowrap items-center gap-[14px] ${className}`}
      style={{ height: rowHeight }}
    >
      {shown.map(brand => {
        const logo = <PublicBrandLogo key={brand.id} name={brand.name} src={brand.logoUrl} slug={brand.slug} shrink={false} className="h-full w-auto min-w-0 max-w-full" />;
        return chip
          ? <span key={brand.id} className="flex h-full min-w-0 items-center rounded-full bg-white/95 px-3 py-[3px]">{logo}</span>
          : logo;
      })}
      {overflow}
    </div>
  );
}
