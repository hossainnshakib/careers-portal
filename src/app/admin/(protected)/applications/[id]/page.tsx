import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { loadReviewProfile } from "@/db/queries/review";
import { questionSectionEnum } from "@/db/schema";
import { safeApplicantUrl } from "@/lib/validation/review";
import { StatusBadge } from "@/components/admin/status-badge";
import { ViewerDate } from "@/components/admin/viewer-date";
import { DeleteApplicationControl, DeleteNoteButton, ReviewControls } from "@/components/admin/review-controls";
import { PdfDownload } from "@/components/admin/pdf-download";
import { displayAnswerValue } from "@/lib/questions/display-answer";
import { applicationStatusLabel } from "@/lib/admin/display";

export default async function ApplicantPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin().catch(redirectAdminDenial);
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) notFound();
  const profile = await loadReviewProfile(parsed.data).catch(() => { throw new Error("Unable to load applicant profile."); });
  if (!profile) notFound();
  const { application: app, answers, files, notes, events, previous } = profile;
  function renderAnswer(answer: (typeof answers)[number]) {
    if (answer.typeSnapshot === "file_upload") {
      const ids = Array.isArray(answer.value) ? answer.value : [];
      const selected = files.filter((file) => ids.includes(file.id));
      return selected.length ? <ul>{selected.map((file) => <li key={file.id}><a className="underline" href={`/api/admin/attachments/${file.id}`}>{file.fileName}</a></li>)}</ul> : <p>Attachment unavailable.</p>;
    }
    const url = answer.typeSnapshot === "url" ? safeApplicantUrl(answer.value) : null;
    if (url) return <a className="break-all underline" href={url} target="_blank" rel="noopener noreferrer nofollow">{url}</a>;
    const value = displayAnswerValue(answer);
    if (Array.isArray(value)) return <ul className="list-inside list-disc">{value.map((item, index) => <li key={index}>{item}</li>)}</ul>;
    return <p className="whitespace-pre-wrap break-words">{value}</p>;
  }
  return <section className="space-y-6">
    {/* Fresh private-document navigation rechecks authorization and renews the CSP nonce. */}
    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
    <a href="/admin/applications" className="underline">All applications</a>
    <header className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold">{app.fullName}</h1><StatusBadge status={app.status} /></div>
      <p className="mt-3 text-lg">{app.jobTitleSnapshot}</p><p>{(app.brandNamesSnapshot ?? []).join(" · ")}</p><p>{app.departmentNameSnapshot}</p>
      <p className="mt-2">{app.reference} · Applied <ViewerDate iso={app.submittedAt.toISOString()} />{app.consentAt && <> · Consent given on <ViewerDate iso={app.consentAt.toISOString()} /></>}</p>
    </header>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-6">
        <section className="rounded border border-border p-5"><h2 className="mb-4 text-xl font-semibold">Personal & contact</h2><dl className="space-y-3">
          {[["Full name", app.fullName], ["Email", app.email], ["Phone", app.phone], ["Location", app.location]].map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="break-all">{value}</dd></div>)}
        </dl></section>
        {questionSectionEnum.enumValues.map((section) => {
          const grouped = answers.filter((answer) => answer.sectionSnapshot === section);
          if (!grouped.length) return null;
          return <section key={section} className="rounded border border-border p-5"><h2 className="mb-4 text-xl font-semibold capitalize">{section.replaceAll("_", " ")}</h2>
            <dl className="space-y-5">{grouped.map((answer) => <div key={answer.id}><dt className="mb-1 font-medium">{answer.labelSnapshot}</dt><dd>{renderAnswer(answer)}</dd></div>)}</dl>
          </section>;
        })}
        {previous.length > 0 && <section className="rounded border border-border p-5"><h2 className="mb-3 text-xl font-semibold">Previous applications from this email</h2><ul className="space-y-2">{previous.map((row) => <li key={row.id}><a href={`/admin/applications/${row.id}`} className="underline">{row.reference} · {row.jobTitle}</a> · <ViewerDate iso={row.submittedAt.toISOString()} /></li>)}</ul>{previous.length === 50 && <p className="mt-3 text-sm">Showing the latest 50 other applications.</p>}</section>}
        <section aria-label="Status history" className="rounded border border-border p-5"><h2 className="mb-3 text-xl font-semibold">Status history</h2><ul className="space-y-3">{events.map((event) => <li key={event.id}><p>{event.fromStatus ? applicationStatusLabel(event.fromStatus) : "Submitted"} → {applicationStatusLabel(event.toStatus)}</p><p className="break-all text-xs text-muted-foreground"><ViewerDate iso={event.createdAt.toISOString()} /> · {event.adminEmail ?? (event.adminUserId ? `Admin ${event.adminUserId}` : "Application submission")}</p></li>)}</ul></section>
      </div>
      <aside className="min-w-0 space-y-6">
        <PdfDownload applicationId={app.id} />
        <ReviewControls key={`${app.id}:${app.statusChangedAt.toISOString()}`} applicationId={app.id} status={app.status} />
        <section className="rounded border border-border p-5"><h2 className="mb-3 text-xl font-semibold">Downloads</h2><ul className="space-y-3">{files.map((file) => <li key={file.id}><a href={`/api/admin/attachments/${file.id}`} className="break-all underline">{file.kind === "cv" ? "Download CV" : `Download ${file.fileName}`}</a><p className="text-xs text-muted-foreground">{file.fileName} · {Math.ceil(file.sizeBytes / 1024)} KB</p></li>)}</ul>{!files.length && <p>No attachments.</p>}</section>
        <section aria-label="Internal notes" className="rounded border border-border p-5"><h2 className="mb-3 text-xl font-semibold">Internal notes</h2>{!notes.length && <p>No notes yet.</p>}<ul className="space-y-5">{notes.map((note) => <li key={note.id}><p className="whitespace-pre-wrap break-words">{note.note}</p><p className="mt-2 break-all text-xs text-muted-foreground">{note.adminEmailSnapshot} · <ViewerDate iso={note.createdAt.toISOString()} /></p>{note.adminUserId === admin.userId && <DeleteNoteButton applicationId={app.id} noteId={note.id} />}</li>)}</ul></section>
        <DeleteApplicationControl applicationId={app.id} reference={app.reference} />
      </aside>
    </div>
  </section>;
}
