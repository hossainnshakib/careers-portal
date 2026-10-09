import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { loadApplicationJob, loadPublicJob } from "@/db/queries/public-jobs";
import { BrandLogo } from "@/components/brand-logo";
import { SafeMarkdown } from "@/lib/markdown/render";
import { getPublicEnv } from "@/lib/env-public";
import { ApplicationForm } from "@/components/public/application-form";

// Server Actions inherit the runtime/duration of the page that renders them.
export const runtime = "nodejs";
export const maxDuration = 60;

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
  const { job, department, options } = await getJob(params);
  // Render the form from fresh authoritative definitions, just as the former
  // apply page did; submission independently reloads them again under its lock.
  const definition = await loadApplicationJob(job.slug).catch(() => { throw new Error("Unable to load the application form."); });
  if (!definition || definition.job.status === "draft" || !definition.brands.some(item => item.brand.status === "active")) notFound();
  const visibleBrands = definition.brands.filter(item => item.brand.status === "active").sort((a, b) => Number(b.primary) - Number(a.primary));
  const closed = definition.job.status !== "open" || (!!definition.job.deadlineAt && definition.job.deadlineAt.getTime() <= Date.now());
  const tags = [
    ...options.map(option => option.label),
    job.experienceText,
    job.salaryMode === "range" ? job.salaryText : "Negotiable",
    job.vacancies ? `${job.vacancies} ${job.vacancies === 1 ? "vacancy" : "vacancies"}` : null,
    job.locationText,
  ].filter((value): value is string => !!value);
  return <main id="main" className="mx-auto max-w-3xl space-y-10 px-5 py-10 pb-28">
    <Link href="/" className="font-bold underline">All roles</Link>
    <header>
      <p className="font-bold">We&rsquo;re hiring · <span className="text-poster">{department.name}</span></p>
      <h1 className="mt-3 text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl">{job.title}</h1>
      <div className="mt-5 flex flex-wrap gap-2">{tags.map(value => <span key={value} className="rounded-full border border-border bg-card px-3 py-1.5 font-bold">{value}</span>)}</div>
      <div className="mt-6 flex flex-wrap items-center gap-4" aria-label="Hiring brands"><span className="font-bold text-muted-foreground">Hiring for</span>
        {visibleBrands.map(({ brand }) => <span key={brand.id} className="flex items-center gap-2 font-bold">
          {brand.logoUrl && <BrandLogo name={brand.name} src={brand.logoUrl} slug={brand.slug} size="tiny" decorative />}<span>{brand.name}</span>
        </span>)}
      </div><p className="mt-6 text-lg leading-relaxed text-muted-foreground">{job.summary}</p>
    </header>
    {!closed && <a href="#apply" className="inline-block rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground">Apply</a>}
    {[["About the role", job.descriptionMd], ["Responsibilities", job.responsibilitiesMd], ["Requirements", job.requirementsMd], ...(job.niceToHaveMd ? [["Nice to have", job.niceToHaveMd] as const] : [])].map(([heading, text]) => <section key={heading}><h2 className="mb-4 text-2xl font-black tracking-tight">{heading}</h2><SafeMarkdown text={text} /></section>)}
    {job.skills.length > 0 && <section><h2 className="mb-4 text-2xl font-black tracking-tight">Skills &amp; expertise</h2><ul className="flex flex-wrap gap-2">{job.skills.map(skill => <li key={skill} className="rounded-full border border-border bg-card px-3 py-1.5 font-bold">{skill}</li>)}</ul></section>}
    {job.benefits.length > 0 && <section><h2 className="mb-4 text-2xl font-black tracking-tight">Compensation &amp; benefits</h2><ul className="space-y-2">{job.benefits.map(benefit => <li key={benefit} className="flex gap-2.5"><span aria-hidden="true" className="font-black text-poster">▶</span><span>{benefit}</span></li>)}</ul></section>}
    {closed ? <section role="status" className="rounded-xl bg-ink px-6 py-10 text-background sm:px-10">
      <h2 className="text-3xl font-black tracking-tight">No longer accepting applications</h2>
      <p className="mt-3">This role has been filled or the application window has closed.</p>
      <Link href="/" className="mt-5 inline-block rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground">Explore open roles</Link>
    </section> :
      <section id="apply" tabIndex={-1} aria-labelledby="apply-title" className="scroll-mt-8 rounded-xl bg-ink px-6 py-10 text-background sm:px-10">
        <h2 id="apply-title" className="text-3xl font-black tracking-tight">Apply for {job.title}</h2>
        <p className="mt-3">No account needed. Your answers go straight to the internal hiring team.</p>
        <div className="mt-8 rounded-lg bg-card p-6 text-foreground sm:p-8">
          <ApplicationForm jobSlug={job.slug} questions={definition.questions} cvRequired={definition.job.cvRequired} />
        </div>
      </section>}
    {!closed && <a href="#apply" className="fixed inset-x-5 bottom-5 z-20 rounded-lg bg-primary p-4 text-center font-bold text-primary-foreground md:hidden">Apply</a>}
  </main>;
}
