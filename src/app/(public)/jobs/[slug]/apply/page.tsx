import { notFound, permanentRedirect } from "next/navigation";
import { jobSlugSchema } from "@/lib/validation/uploads";

/** Next config supplies the HTTP 308; retain this fallback for direct rendering. */
export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const parsed = jobSlugSchema.safeParse((await params).slug);
  if (!parsed.success) notFound();
  permanentRedirect(`/jobs/${parsed.data}#apply`);
}
