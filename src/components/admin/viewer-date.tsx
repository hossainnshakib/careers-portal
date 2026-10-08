import { formatAdminDate } from "@/lib/admin/display";

export function ViewerDate({ iso }: { iso: string }) {
  return <time dateTime={iso}>{formatAdminDate(iso)}</time>;
}
