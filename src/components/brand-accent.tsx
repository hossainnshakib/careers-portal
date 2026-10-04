export function safeAccent(color: string | null | undefined): string {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : "#374151";
}

export function BrandAccent({ color }: { color: string | null }) {
  return (
    <span
      aria-hidden="true"
      className="block h-1 w-full"
      style={{ backgroundColor: safeAccent(color) }}
    />
  );
}
