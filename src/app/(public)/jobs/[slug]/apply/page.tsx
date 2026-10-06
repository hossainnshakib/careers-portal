import Link from "next/link";
import { notFound } from "next/navigation";
import { loadApplicationJob } from "@/db/queries/public-jobs";
import { jobSlugSchema } from "@/lib/validation/uploads";
import { ApplicationForm } from "@/components/public/application-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Apply · Careers", robots: { index: false, follow: true } };
export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const parsed = jobSlugSchema.safeParse((await params).slug);
  if (!parsed.success) notFound();
  const definition = await loadApplicationJob(parsed.data);
  if (!definition || !definition.brands.some((b) => b.brand.status === "active")) notFound();
  const { job, questions } = definition;
  return <main id="main" className="mx-auto max-w-2xl px-5 py-10">
    <Link href={`/jobs/${job.slug}`} className="underline">Back to role</Link>
    <h1 className="mt-6 text-3xl font-semibold">Apply for {job.title}</h1>
    <p className="my-4 text-muted-foreground">{definition.brands.filter((b) => b.brand.status === "active").map((b) => b.brand.name).join(" · ")}</p>
    {job.status !== "open" || (job.deadlineAt && job.deadlineAt.getTime() <= Date.now()) ? <p role="status">This role is no longer accepting applications.</p> :
      <ApplicationForm jobSlug={job.slug} questions={questions} cvRequired={job.cvRequired} />}
  </main>;
}
