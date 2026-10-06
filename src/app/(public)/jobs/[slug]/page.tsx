import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { loadPublicJob } from "@/db/queries/public-jobs";
import { BrandLogo } from "@/components/brand-logo";
import { SafeMarkdown } from "@/lib/markdown/render";
import { humanize } from "@/lib/careers/filters";
import { getPublicEnv } from "@/lib/env-public";

async function getJob(params: Promise<{ slug: string }>) {
  const parsed = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120).safeParse((await params).slug);
  if (!parsed.success) notFound();
  const data = await loadPublicJob(parsed.data);
  if (!data || !data.brands.some((b) => b.brand.status === "active")) notFound();
  return data;
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { job } = await getJob(params);
  const url = `${getPublicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/jobs/${job.slug}`;
  return { title: `${job.title} · Careers`, description: job.summary, alternates: { canonical: url }, openGraph: { title: job.title, description: job.summary, url, type: "website" } };
}
export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { job, department, brands } = await getJob(params);
  const visibleBrands = brands.filter((b) => b.brand.status === "active");
  const closed = job.status !== "open" || (!!job.deadlineAt && new Date(job.deadlineAt).getTime() <= Date.now());
  return <main id="main" className="mx-auto max-w-3xl space-y-8 px-5 py-10 pb-28">
    <Link href="/" className="underline">All roles</Link>
    <div className="grid gap-3 sm:grid-cols-2">{visibleBrands.map(({ brand }) => <BrandLogo key={brand.id} name={brand.name} src={brand.logoUrl} />)}</div>
    <header><p className="text-muted-foreground">{visibleBrands.map(({ brand }) => brand.name).join(" · ")}</p>
      <h1 className="mt-3 text-4xl font-semibold">{job.title}</h1><p className="mt-4">{department.name}</p>
      <p className="mt-2 capitalize">{humanize(job.employmentType)} · {job.workMode}{job.experienceLevel ? ` · ${job.experienceLevel}` : ""}</p>
      {job.locationText && <p className="mt-2">{job.locationText}</p>}<p className="mt-4 text-muted-foreground">{job.summary}</p>
    </header>
    {closed ? <section role="status" className="rounded-xl border border-border p-5"><h2 className="font-semibold">No longer accepting applications</h2><Link href="/" className="underline">Explore open roles</Link></section> :
      <Link href={`/jobs/${job.slug}/apply`} className="fixed inset-x-5 bottom-5 z-20 rounded-lg bg-primary p-4 text-center font-semibold text-primary-foreground sm:static sm:inline-block">Apply for this role</Link>}
    {[["About the role", job.descriptionMd], ["Responsibilities", job.responsibilitiesMd], ["Requirements", job.requirementsMd]].map(([heading, text]) => <section key={heading}><h2 className="mb-4 text-2xl font-semibold">{heading}</h2><SafeMarkdown text={text} /></section>)}
    <section><h2 className="text-2xl font-semibold">How applying works</h2><p className="mt-3">Tell us about yourself, share your CV and answer the role-specific questions. You will receive an application reference after submitting.</p></section>
  </main>;
}
