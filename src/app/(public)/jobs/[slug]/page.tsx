import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { loadApplicationJob, loadPublicJob } from "@/db/queries/public-jobs";
import { BrandLogo } from "@/components/brand-logo";
import { SafeMarkdown } from "@/lib/markdown/render";
import { humanize } from "@/lib/careers/filters";
import { getPublicEnv } from "@/lib/env-public";
import { ApplicationForm } from "@/components/public/application-form";

async function getJob(params: Promise<{ slug: string }>) {
  const parsed = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120).safeParse((await params).slug);
  if (!parsed.success) notFound();
  const data = await loadPublicJob(parsed.data).catch(() => { throw new Error("Unable to load this role."); });
  if (!data || data.job.status === "draft" || !data.brands.some((b) => b.brand.status === "active")) notFound();
  return data;
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { job } = await getJob(params);
  const url = `${getPublicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/jobs/${job.slug}`;
  const description = job.summary || `Explore the ${job.title} role, read the requirements and apply without an account.`;
  return { title: `${job.title} · Careers`, description, alternates: { canonical: url }, openGraph: { title: job.title, description, url, type: "website", siteName: "Careers" } };
}
export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { job, department } = await getJob(params);
  // Render the form from fresh authoritative definitions, just as the former
  // apply page did; submission independently reloads them again under its lock.
  const definition = await loadApplicationJob(job.slug).catch(() => { throw new Error("Unable to load the application form."); });
  if (!definition || definition.job.status === "draft" || !definition.brands.some(item => item.brand.status === "active")) notFound();
  const visibleBrands = definition.brands.filter(item => item.brand.status === "active").sort((a, b) => Number(b.primary) - Number(a.primary));
  const closed = definition.job.status !== "open" || (!!definition.job.deadlineAt && definition.job.deadlineAt.getTime() <= Date.now());
  return <main id="main" className="mx-auto max-w-3xl space-y-8 px-5 py-10 pb-28">
    <Link href="/" className="underline">All roles</Link>
    <header>
      <h1 className="text-4xl font-bold leading-tight">{job.title}</h1><p className="mt-4">Department · {department.name}</p>
      <div className="mt-4 flex flex-wrap gap-2">{[humanize(job.employmentType), job.workMode, job.experienceLevel, job.locationText].filter(Boolean).map(value => <span key={value} className="rounded-lg border border-border px-3 py-2 capitalize">{value}</span>)}</div>
      <div className="mt-5 flex flex-wrap items-center gap-4" aria-label="Hiring brands"><span className="text-muted-foreground">Hiring for</span>
        {visibleBrands.map(({ brand }) => <span key={brand.id} className="flex items-center gap-2">
          {brand.logoUrl && <BrandLogo name={brand.name} src={brand.logoUrl} slug={brand.slug} size="tiny" decorative />}<span>{brand.name}</span>
        </span>)}
      </div><p className="mt-5 leading-relaxed text-muted-foreground">{job.summary}</p>
    </header>
    {closed ? <section role="status" className="rounded-lg border border-border p-5"><h2 className="font-bold">No longer accepting applications</h2><Link href="/" className="mt-3 inline-block underline">Explore open roles</Link></section> :
      <a href="#apply" className="inline-block rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground">Apply</a>}
    {[["About the role", job.descriptionMd], ["Responsibilities", job.responsibilitiesMd], ["Requirements", job.requirementsMd]].map(([heading, text]) => <section key={heading}><h2 className="mb-4 text-2xl font-bold">{heading}</h2><SafeMarkdown text={text} /></section>)}
    {!closed && <section id="apply" tabIndex={-1} aria-labelledby="apply-title" className="scroll-mt-8 border-t border-border pt-10">
      <h2 id="apply-title" className="mb-6 text-3xl font-bold">Apply for {job.title}</h2>
      <ApplicationForm jobSlug={job.slug} questions={definition.questions} cvRequired={definition.job.cvRequired} />
    </section>}
    {!closed && <a href="#apply" className="fixed inset-x-5 bottom-5 z-20 rounded-lg bg-primary p-4 text-center font-bold text-primary-foreground md:hidden">Apply</a>}
  </main>;
}
