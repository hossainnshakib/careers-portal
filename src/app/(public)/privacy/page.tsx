import Link from "next/link";
import { getPublicSiteUrl } from "@/lib/env-public";
import { SafeMarkdown } from "@/lib/markdown/render";
import { privacyPolicyDates, privacyPolicyIntroduction, privacyPolicySections } from "@/lib/privacy/policy";
import "./privacy.css";

export const metadata = {
  title: "Privacy Policy · Careers",
  description: "How Fixen Media and its hiring brands collect, use, protect and retain recruitment information, and how to exercise your privacy rights.",
  alternates: { canonical: `${getPublicSiteUrl()}/privacy` },
  openGraph: { title: "Privacy Policy · Careers", description: "Recruitment privacy, data retention, contact details and your rights.", url: `${getPublicSiteUrl()}/privacy`, type: "website" as const },
};

export default function PrivacyPage() {
  return <main id="main" className="privacy-page mx-auto w-full max-w-[1100px] px-5 py-10 sm:px-8">
    <Link href="/#roles" className="text-[14px] font-semibold text-ui-blue-text underline">Back to roles</Link>
    <article aria-labelledby="privacy-title" className="ui-glass mt-[18px] rounded-[28px] p-6 text-ui-body sm:p-10 lg:p-12">
      <header className="border-b border-ui-border pb-8">
        <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-ui-blue-text">Recruitment privacy</p>
        <h1 id="privacy-title" className="mt-3 text-[36px] font-extrabold leading-tight tracking-[-.03em] text-ui-ink sm:text-[48px]">Privacy Policy</h1>
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-[14px]">
          <div><dt className="font-semibold text-ui-muted">Effective Date</dt><dd className="mt-1"><time dateTime={privacyPolicyDates.iso}>{privacyPolicyDates.effective}</time></dd></div>
          <div><dt className="font-semibold text-ui-muted">Last Updated</dt><dd className="mt-1"><time dateTime={privacyPolicyDates.iso}>{privacyPolicyDates.updated}</time></dd></div>
        </dl>
      </header>
      <div className="privacy-prose mt-8"><SafeMarkdown text={privacyPolicyIntroduction} /></div>
      <details className="privacy-contents my-9 rounded-[18px] border border-ui-border bg-white/70">
        <summary className="cursor-pointer p-5 font-bold text-ui-ink">Contents <span className="ml-2 text-[13px] font-normal text-ui-muted">{privacyPolicySections.length} sections</span></summary>
        <nav aria-label="Privacy policy sections" className="px-5 pb-5">
          <ol className="grid gap-x-7 gap-y-1 sm:grid-cols-2">
            {privacyPolicySections.map(section => <li key={section.id}><a className="block rounded-md py-2 text-[14px] leading-relaxed text-ui-blue-text underline decoration-transparent underline-offset-4 hover:decoration-current focus-visible:decoration-current" href={`#${section.id}`}>{section.title}</a></li>)}
          </ol>
        </nav>
      </details>
      <div className="privacy-sections">
        {privacyPolicySections.map(section => <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} tabIndex={-1} className="privacy-section">
          <h2 id={`${section.id}-title`} className="text-[24px] font-extrabold leading-snug tracking-[-.02em] text-ui-ink sm:text-[28px]">{section.title}</h2>
          <div className="privacy-prose mt-5"><SafeMarkdown text={section.text} /></div>
          <a href="#privacy-title" className="mt-6 inline-block text-[13px] font-semibold text-ui-blue-text underline underline-offset-4">Back to top</a>
        </section>)}
      </div>
    </article>
  </main>;
}
