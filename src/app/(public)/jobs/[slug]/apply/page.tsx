import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { loadApplicationJob } from "@/db/queries/public-jobs";
import { getPublicEnv } from "@/lib/env-public";
import { accentColor } from "@/lib/careers/presentation";
import { ApplicationForm } from "@/components/public/application-form";
import { PublicBrandLogo } from "@/components/public/public-brand-logo";
import { PublicDeadline } from "@/components/public/public-deadline";
import { PublicIcon } from "@/components/public/public-icon";

export const runtime = "nodejs";
export const maxDuration = 60;

async function getApplication(params: Promise<{ slug: string }>) {
  const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120).safeParse((await params).slug);
  if (!slug.success) notFound();
  const data = await loadApplicationJob(slug.data).catch(() => { throw new Error("Unable to load the application form."); });
  if (!data || data.job.status === "draft" || !data.brands.some(item => item.brand.status === "active")) notFound();
  return data;
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { job } = await getApplication(params);
  const url = `${getPublicEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/jobs/${job.slug}`;
  return { title: `Apply for ${job.title} · Careers`, description: `Apply for the ${job.title} role without an account.`, robots: { index: false, follow: false }, alternates: { canonical: url } };
}
export default async function ApplyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { job, department, brands, questions, options } = await getApplication(params);
  const visibleBrands = brands.filter(item => item.brand.status === "active").sort((a, b) => Number(b.primary) - Number(a.primary));
  const closed = job.status !== "open" || (!!job.deadlineAt && job.deadlineAt.getTime() <= Date.now());
  const deadline = job.deadlineAt?.toISOString();
  return <main id="main" className="relative isolate pb-2">
    <div aria-hidden="true" className="ui-orbs pointer-events-none absolute inset-0 -z-10 overflow-clip">
      {visibleBrands.slice(0, 2).map(({ brand }, index) => <span key={brand.id} className="absolute h-[420px] w-[420px] rounded-full opacity-20 blur-[110px]" style={{ backgroundColor: accentColor(brand.accentColor), left: index ? "84%" : "-6%", top: index ? "520px" : "120px" }} />)}
    </div>
    <div className="mx-auto max-w-[820px] px-6 pt-9">
      <Link href={`/jobs/${job.slug}`} className="inline-flex items-center gap-2 text-[14px] font-semibold text-ui-muted"><PublicIcon name="back" />Back to job</Link>
      <header className="ui-glass mt-[18px] flex flex-col gap-[14px] rounded-[28px] px-6 py-7 sm:px-[30px]">
        {department && <p className="text-[12.5px] font-extrabold uppercase tracking-[.1em] text-ui-muted">{department.name}</p>}
        <h1 className="text-[30px] font-extrabold leading-[1.1] tracking-[-.03em] sm:text-[38px]">Apply for {job.title}</h1>
        <div aria-label="Hiring brands" className="flex flex-wrap items-center gap-2.5"><span className="text-[13px] font-bold text-ui-muted">Hiring for</span>{visibleBrands.map(({ brand }) => <span key={brand.id} className="inline-flex items-center rounded-full bg-white/90 px-[11px] py-1.5"><PublicBrandLogo name={brand.name} src={brand.logoUrl} slug={brand.slug} className="h-[24px] max-w-[110px]" /></span>)}</div>
        <div className="flex flex-wrap gap-2">
          {options.filter(option => option.isActive).map(option => <span key={option.id} className="ui-pill">{option.label}</span>)}
          {job.locationText && <span className="ui-pill">{job.locationText}</span>}
          <span className="ui-pill ui-pill-salary">{job.salaryMode === "range" && job.salaryText ? job.salaryText : "Negotiable"}</span>
          {deadline && <span className="ui-pill">Apply before <PublicDeadline value={deadline} /></span>}
        </div>
      </header>
      {closed ? <section role="status" className="ui-glass mt-[22px] space-y-3 rounded-[28px] p-7"><h2 className="text-[22px] font-extrabold">No longer accepting applications</h2><p className="text-ui-muted">This role has been filled or the application window has closed.</p><Link href={`/jobs/${job.slug}`} className="font-semibold text-ui-blue-text underline">Read the job details</Link></section> : <section aria-label="Application form" className="ui-glass mt-[22px] rounded-[28px] px-6 pb-[38px] pt-[34px] sm:px-[34px]">
        <ApplicationForm jobSlug={job.slug} questions={questions} cvRequired={job.cvRequired} />
      </section>}
    </div>
  </main>;
}
