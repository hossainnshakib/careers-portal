import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

export const metadata = { title: "Application submitted · Careers", description: "Keep your application reference for your records.", robots: { index: false, follow: false }, openGraph: { title: "Application submitted · Careers", description: "Keep your application reference for your records.", type: "website" as const } };
export default async function AppliedPage({ params }: { params: Promise<{ reference: string }> }) {
  const parsed = z.string().regex(/^APP-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/).safeParse((await params).reference);
  if (!parsed.success) notFound();
  // Never look up or expose applicant records through this public acknowledgement.
  return <main id="main" className="mx-auto max-w-[820px] px-6 py-12"><div className="ui-glass rounded-[28px] p-7 sm:p-10"><p className="ui-label mb-3 text-ui-blue-text">Thank you</p><h1 className="text-[34px] font-extrabold tracking-[-.03em] sm:text-[38px]">Application submitted</h1>
    <p className="mt-5 text-lg">Your application reference is <strong>{parsed.data}</strong>.</p>
    <p className="mt-4 text-muted-foreground">Keep this reference for your records. The hiring team will review your application.</p>
    <Link href="/#roles" className="ui-button mt-6">Explore other roles</Link></div></main>;
}
