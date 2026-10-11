import Link from "next/link";
import { getPublicContactEmail, getPublicSiteUrl } from "@/lib/env-public";

export const metadata = {
  title: "Privacy · Careers",
  description: "How application information is collected, used and managed. Draft for owner review.",
  alternates: { canonical: `${getPublicSiteUrl()}/privacy` },
  openGraph: { title: "Privacy · Careers", description: "How application information is collected, used and managed. Draft for owner review.", url: `${getPublicSiteUrl()}/privacy`, type: "website" as const },
};

export default function PrivacyPage() {
  const contact = getPublicContactEmail();
  return <main id="main" className="mx-auto max-w-[820px] px-6 py-10">
    <Link href="/#roles" className="text-[14px] font-semibold text-ui-blue-text underline">Back to roles</Link>
    <article className="ui-glass mt-[18px] space-y-8 rounded-[28px] p-7 text-ui-body sm:p-10">
    <header><h1 className="text-[38px] font-extrabold tracking-[-.03em] text-ui-ink">Privacy</h1>
      <p className="mt-5 rounded-[18px] border border-ui-border bg-white/70 p-4"><strong>Draft — owner review required.</strong> The portal owner must confirm the contact address and retention policy before launch.</p>
    </header>
    <section><h2 className="text-[26px] font-extrabold tracking-tight text-ui-ink">What we collect</h2><p className="mt-3 leading-relaxed">When you apply, we collect your name, email, phone, location, the position you selected, your answers and the files requested by that role. You do not need a candidate account. Share only information relevant to your application.</p></section>
    <section><h2 className="text-[26px] font-extrabold tracking-tight text-ui-ink">How it is used and who sees it</h2><p className="mt-3 leading-relaxed">The internal hiring team uses this information to review applications. Authorized administrators can add internal notes, update application status, download files and export a candidate profile. Applications and attachments are not public. Files are stored privately and administrator download links expire shortly after issue.</p>
      <p className="mt-3 leading-relaxed">The portal uses Supabase for database, authentication and file storage, Vercel for hosting, and Cloudflare Turnstile for its security check. Turnstile receives the information needed to perform that check.</p>
    </section>
    <section><h2 className="text-[26px] font-extrabold tracking-tight text-ui-ink">Retention</h2><p className="mt-3 leading-relaxed">Submitted applications have no automatic deletion deadline in this version. The hiring team can delete an application and its attached files. The owner must set and publish the recruitment retention policy before launch. Temporary uploads that were not submitted are eligible for daily cleanup once their creation and last-update dates are more than 24 hours old.</p></section>
    <section><h2 className="text-[26px] font-extrabold tracking-tight text-ui-ink">Ask for deletion</h2><p className="mt-3 leading-relaxed">Contact the portal owner and include your application reference so the team can locate your application. Do not send additional documents unless requested.</p>
      <p className="mt-3">{contact ? <>Send your request to <a href={`mailto:${contact}`} className="underline">{contact}</a>.</> : "The deletion contact email is awaiting confirmation by the owner."}</p>
    </section>
    </article>
  </main>;
}
