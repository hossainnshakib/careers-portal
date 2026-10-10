import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { loadApplicationJob, loadPublicJob } from "@/db/queries/public-jobs";
import { SafeMarkdown } from "@/lib/markdown/render";
import { getPublicEnv } from "@/lib/env-public";
import { accentColor, publicWebsite } from "@/lib/careers/presentation";
import { groupLabels } from "@/lib/careers/option-labels";
import { PublicBrandLogo } from "@/components/public/public-brand-logo";
import { PublicIcon } from "@/components/public/public-icon";
import { PublicDeadline } from "@/components/public/public-deadline";

export const runtime = "nodejs";
export const maxDuration = 60;

async function getJob(params: Promise<{ slug: string }>) {
  const parsed = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120).safeParse((await params).slug);
  if (!parsed.success) notFound();
  const data = await loadPublicJob(parsed.data).catch(() => { throw new Error("Unable to load this role."); });
  if (!data || data.job.status === "draft" || !data.brands.some(item => item.brand.status === "active")) notFound();
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
  // Retain the uncached visibility/deadline check; no form is rendered here.
  const current = await loadApplicationJob(job.slug).catch(() => { throw new Error("Unable to load this role."); });
  if (!current || current.job.status === "draft" || !current.brands.some(item => item.brand.status === "active")) notFound();
  const visibleBrands = current.brands.filter(item => item.brand.status === "active").sort((a, b) => Number(b.primary) - Number(a.primary));
  const primaryAccent = accentColor(visibleBrands[0]?.brand.accentColor);
  const closed = current.job.status !== "open" || (!!current.job.deadlineAt && current.job.deadlineAt.getTime() <= Date.now());
  const deadline = current.job.deadlineAt?.toISOString() ?? null;
  const applyUrl = `/jobs/${job.slug}/apply`;
  const experience = [job.experienceText, ...groupLabels(options, "experience")].filter(Boolean).join(" · ");
  const engagement = [...groupLabels(options, "engagement"), job.engagementNote].filter(Boolean).join(" · ");
  const rows = [
    ["Salary", job.salaryMode === "range" ? job.salaryText : "Negotiable", "salary"],
    ["Vacancy", job.vacancies?.toString(), "people"],
    ["Experience", experience, "briefcase"],
    ["Work arrangement", groupLabels(options, "arrangement").join(" · "), "building"],
    ["Engagement", engagement, "clock"],
    ["Location", job.locationText, "location"],
    ["Deadline", deadline, "calendar"],
  ] as const;
  return <main id="main" className="pb-2">
    <header className="relative isolate mx-3 mt-5 rounded-[28px] bg-ui-ink text-white sm:mx-5 sm:rounded-[36px]" style={{ backgroundImage: `linear-gradient(135deg, ${primaryAccent}2e, #0e1626)` }}>
      <div aria-hidden="true" className="ui-orbs pointer-events-none absolute inset-0 -z-10 overflow-clip rounded-[inherit] opacity-[.22]">
        <span className="absolute -top-[140px] left-[62%] h-[460px] w-[460px] rounded-full blur-[100px]" style={{ backgroundColor: primaryAccent }} />
        <span className="absolute left-[8%] top-[200px] h-[380px] w-[380px] rounded-full blur-[100px]" style={{ backgroundColor: accentColor(visibleBrands[1]?.brand.accentColor ?? primaryAccent) }} />
      </div>
      <div className="ui-container flex flex-col gap-[18px] pb-[52px] pt-11">
        <Link href="/#roles" className="inline-flex w-fit items-center gap-2 text-[14px] font-semibold text-white/85"><PublicIcon name="back" />All roles</Link>
        <p className="mt-2 text-[12.5px] font-extrabold uppercase tracking-[.12em] text-white/85">{department.name}</p>
        <h1 className="text-[38px] font-extrabold leading-[1.05] tracking-[-.035em] sm:text-[60px]">{job.title}</h1>
        {job.summary && <p className="max-w-[640px] text-[18px] leading-[1.55] text-white/85">{job.summary}</p>}
        <div className="mt-1 flex flex-wrap gap-[9px]">
          {options.map(option => <span key={`${option.group}:${option.slug}`} className="ui-hero-pill">{option.label}</span>)}
          {job.locationText && <span className="ui-hero-pill">{job.locationText}</span>}
          {deadline && <span className="ui-hero-pill">Apply before <PublicDeadline value={deadline} /></span>}
        </div>
        <div aria-label="Hiring brands" className="mt-2 flex flex-wrap items-center gap-3"><span className="text-[13px] font-bold text-white/85">Hiring for</span>
          {visibleBrands.map(({ brand }) => <span key={brand.id} className="inline-flex items-center rounded-full bg-white/95 px-3 py-[7px]"><PublicBrandLogo name={brand.name} src={brand.logoUrl} slug={brand.slug} className="h-[26px] max-w-[110px]" /></span>)}
        </div>
      </div>
    </header>
    <div className="ui-container ui-detail-grid pb-2 pt-11" data-testid="job-detail-grid">
      <div className="min-w-0 space-y-11">
        {([
          ["About the role", "Why this role exists", job.descriptionMd, ""],
          ["What you will do", "Key responsibilities", job.responsibilitiesMd, "ui-numbered-markdown"],
          ["What we are looking for", "Requirements", job.requirementsMd, "ui-check-markdown"],
          ["Nice to have", "What keeps you ahead", job.niceToHaveMd, "ui-check-markdown"],
        ] as const).filter(([, , text]) => text.trim()).map(([label, title, text, style]) => <section key={label} className="space-y-[14px]">
          <SectionHeading label={label} title={title} />
          <div className={`ui-job-markdown text-[16px] leading-[1.75] text-ui-body ${style}`}><SafeMarkdown text={text} /></div>
        </section>)}
        {!!job.skills.length && <section className="space-y-[14px]"><SectionHeading label="Skills & expertise" title="Skills and areas of expertise" /><ul className="flex flex-wrap gap-[9px]">{job.skills.map(skill => <li key={skill} className="ui-glass rounded-full px-[15px] py-[9px] text-[13.5px] font-semibold">{skill}</li>)}</ul></section>}
        {!!job.benefits.length && <section className="space-y-[14px]"><SectionHeading label="Why join us" title="Compensation & benefits" /><ul className="grid gap-[14px] sm:grid-cols-2">{job.benefits.map(benefit => <li key={benefit} className="ui-glass flex items-center gap-[14px] rounded-[18px] px-5 py-[18px] text-[15px] font-semibold"><span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ui-blue-surface text-ui-blue-text"><PublicIcon name="check" size={18} /></span>{benefit}</li>)}</ul></section>}
        <section className="space-y-[14px]"><SectionHeading label="About the hiring brands" title="Who you would work with" /><div className="flex flex-wrap gap-4">{visibleBrands.map(({ brand }) => {
          const website = publicWebsite(brand.website);
          return <div key={brand.id} className="ui-glass flex flex-[1_1_260px] flex-col gap-2.5 rounded-[20px] p-5">
            <PublicBrandLogo name={brand.name} src={brand.logoUrl} slug={brand.slug} className="h-[34px] max-w-[110px]" />
            {brand.description?.trim() && brand.description.trim() !== "TBD" && <p className="text-[13.5px] leading-[1.55] text-ui-muted">{brand.description}</p>}
            {website && <a href={website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ui-blue-text">Visit website <PublicIcon name="external" size={14} /></a>}
          </div>;
        })}</div></section>
        {closed ? <section role="status" className="ui-glass space-y-3 rounded-[26px] px-[30px] py-7"><h2 className="text-[22px] font-extrabold">No longer accepting applications</h2><p className="text-ui-muted">This role has been filled or the application window has closed.</p><Link href="/#roles" className="inline-block font-semibold text-ui-blue-text underline">Explore open roles</Link></section> : <section className="ui-glass flex flex-wrap items-center justify-between gap-5 rounded-[26px] px-[30px] py-7"><div><h2 className="text-[22px] font-extrabold tracking-[-.02em]">Ready to apply?</h2><p className="mt-1 text-[14.5px] text-ui-muted">It takes a few minutes. No account needed.</p></div><Link href={applyUrl} className="ui-button">Apply now <PublicIcon name="arrow" /></Link></section>}
      </div>
      <aside aria-label="Job summary" data-testid="job-summary-panel" className="ui-sticky-panel ui-glass self-start rounded-[26px] px-6 pb-[26px] pt-6">
        <h2 className="ui-label mb-1.5 text-ui-muted">Job summary</h2>
        <dl>{rows.filter(([, value]) => value).map(([label, value, icon]) => <div key={label} className="relative min-h-[65px] border-b border-ui-border py-[13px] pl-[52px]">
          <dt className="text-[11.5px] font-extrabold uppercase tracking-[.08em] text-ui-muted"><span aria-hidden="true" className="absolute left-0 top-[13px] flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-ui-neutral-surface text-ui-chip"><SummaryIcon name={icon} /></span>{label}</dt>
          <dd className="mt-0.5 break-words text-[15px] font-bold">{label === "Deadline" ? <PublicDeadline value={value!} /> : value}</dd>
        </div>)}</dl>
        {!closed && <Link href={applyUrl} className="ui-button ui-button-block mt-5 shadow-[0_10px_30px_rgba(11,18,32,.22)]">Apply now <PublicIcon name="arrow" /></Link>}
      </aside>
    </div>
  </main>;
}

function SectionHeading({ label, title }: { label: string; title: string }) {
  return <div><p className="ui-label text-ui-blue-text">{label}</p><h2 className="mt-1.5 text-[26px] font-extrabold tracking-[-.02em]">{title}</h2></div>;
}
function SummaryIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    salary: "M3 10h18M16 14h3M6 6h12a3 3 0 013 3v8a3 3 0 01-3 3H6a3 3 0 01-3-3V9a3 3 0 013-3Z",
    people: "M2.5 20c.6-3.4 3.2-5 6.5-5s5.9 1.6 6.5 5M16.5 14.2c3 .1 4.7 1.6 5.2 4.3",
    briefcase: "M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M5 7h14a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2Z",
    building: "M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2Z",
    clock: "M12 7v5l3 2", location: "M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11Z",
    calendar: "M3 10h18M8 3v4M16 3v4M6 5h12a3 3 0 013 3v10a3 3 0 01-3 3H6a3 3 0 01-3-3V8a3 3 0 013-3Z",
  };
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} />{name === "clock" && <circle cx="12" cy="12" r="9" />}{name === "location" && <circle cx="12" cy="10" r="2.5" />}{name === "people" && <><circle cx="9" cy="8" r="3.5" /><circle cx="17.5" cy="9" r="2.5" /></>}</svg>;
}
