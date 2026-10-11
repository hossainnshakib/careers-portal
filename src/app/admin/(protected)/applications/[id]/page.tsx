import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { loadReviewProfile } from "@/db/queries/review";
import { questionSectionEnum } from "@/db/schema";
import { safeApplicantUrl } from "@/lib/validation/review";
import { StatusBadge } from "@/components/admin/status-badge";
import { ViewerDate } from "@/components/admin/viewer-date";
import { BrandMarks } from "@/components/admin/brand-mark";
import { DeleteApplicationControl, DeleteNoteButton, ReviewControls } from "@/components/admin/review-controls";
import { PdfDownload } from "@/components/admin/pdf-download";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { displayAnswerValue } from "@/lib/questions/display-answer";
import { applicationStatusLabel } from "@/lib/admin/display";
import { snapshotAccent } from "@/lib/brands/contrast";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="admin-row">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  );
}

export default async function ApplicantPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin().catch(redirectAdminDenial);
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) notFound();
  const profile = await loadReviewProfile(parsed.data).catch(() => { throw new Error("Unable to load applicant profile."); });
  if (!profile) notFound();
  const { application: app, answers, files, notes, events, previous, brandAccents } = profile;
  function renderAnswer(answer: (typeof answers)[number]) {
    if (answer.typeSnapshot === "file_upload") {
      const ids = Array.isArray(answer.value) ? answer.value : [];
      const selected = files.filter((file) => ids.includes(file.id));
      return selected.length ? <ul>{selected.map((file) => <li key={file.id}><a className="admin-link" href={`/api/admin/attachments/${file.id}`}>{file.fileName}</a></li>)}</ul> : <p>Attachment unavailable.</p>;
    }
    const url = answer.typeSnapshot === "url" ? safeApplicantUrl(answer.value) : null;
    if (url) return <a className="admin-link" style={{ overflowWrap: "anywhere" }} href={url} target="_blank" rel="noopener noreferrer nofollow">{url}</a>;
    const value = displayAnswerValue(answer);
    if (Array.isArray(value)) return <ul style={{ margin: 0, paddingLeft: 18 }}>{value.map((item, index) => <li key={index}>{item}</li>)}</ul>;
    return <p style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{value}</p>;
  }
  const marks = (app.brandNamesSnapshot ?? []).map((name) => ({
    id: name,
    name,
    accentColor: snapshotAccent(name, brandAccents),
    logoUrl: brandAccents.filter((item) => item.name === name).length === 1
      ? brandAccents.find((item) => item.name === name)?.logoUrl ?? null : null,
  }));
  return (
    <section>
      <AdminToolbar eyebrow={`Applications / ${app.reference}`} eyebrowHref="/admin/applications" title={app.fullName} />

      <header className="admin-card" style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusBadge status={app.status} />
            <span className="admin-muted">{app.reference}</span>
          </div>
          <BrandMarks brands={marks} size="lg" />
        </div>
        <p className="admin-muted" style={{ margin: "8px 0 0" }}>
          {app.jobTitleSnapshot}
          <br />
          Applied <ViewerDate iso={app.submittedAt.toISOString()} />
          {app.consentAt && <> · Consent given on <ViewerDate iso={app.consentAt.toISOString()} /></>}
          <br />
          {[app.email, app.phone, app.location].filter(Boolean).join(" · ")}
          {app.departmentNameSnapshot && <><br />{app.departmentNameSnapshot}</>}
        </p>
      </header>

      <div className="admin-grid admin-grid-rail">
        <div className="admin-stack admin-profile-content">
          <section className="admin-card">
            <h2 className="admin-kicker">Personal &amp; contact</h2>
            {[["Full name", app.fullName], ["Email", app.email], ["Phone", app.phone], ["Location", app.location]].map(([label, value]) => (
              <Row key={label} label={label}>{value}</Row>
            ))}
          </section>

          {questionSectionEnum.enumValues.map((section) => {
            const grouped = answers.filter((answer) => answer.sectionSnapshot === section);
            if (!grouped.length) return null;
            return (
              <section key={section} className="admin-card">
                <h2 className="admin-kicker">{section.replaceAll("_", " ")}</h2>
                {grouped.map((answer) => (
                  <Row key={answer.id} label={answer.labelSnapshot}>{renderAnswer(answer)}</Row>
                ))}
              </section>
            );
          })}

          {previous.length > 0 && (
            <section>
              <h2 className="admin-kicker">Previous applications from this email</h2>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
                {previous.map((row) => (
                  <li key={row.id}>
                    <a href={`/admin/applications/${row.id}`} className="admin-link">{row.reference} · {row.jobTitle}</a>
                    <span className="admin-note"> · <ViewerDate iso={row.submittedAt.toISOString()} /></span>
                  </li>
                ))}
              </ul>
              {previous.length === 50 && <p className="admin-note">Showing the latest 50 other applications.</p>}
            </section>
          )}

          <section aria-label="Status history">
            <h2 className="admin-kicker">Status history</h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
              {events.map((event) => (
                <li key={event.id}>
                  <p style={{ margin: 0 }}>
                    {event.fromStatus ? applicationStatusLabel(event.fromStatus) : "Submitted"} → {applicationStatusLabel(event.toStatus)}
                  </p>
                  <p className="admin-note" style={{ margin: 0 }}>
                    <ViewerDate iso={event.createdAt.toISOString()} /> · {event.adminEmail ?? (event.adminUserId ? `Admin ${event.adminUserId}` : "Application submission")}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="admin-stack admin-profile-rail">
          <details className="admin-rail-details" open>
            <summary className="admin-rail-summary">Status, notes &amp; downloads</summary>
            <PdfDownload applicationId={app.id} />
            <ReviewControls key={`${app.id}:${app.statusChangedAt.toISOString()}`} applicationId={app.id} status={app.status} />

            <section className="admin-card">
              <h2 className="admin-kicker">Attachments</h2>
              {!files.length && <p className="admin-muted" style={{ margin: 0 }}>No attachments.</p>}
              {files.map((file) => (
                <div className="admin-row" key={file.id}>
                  <span>{file.kind === "cv" ? "CV" : file.fileName.split(".")[0]}</span>
                  <div>
                    <a href={`/api/admin/attachments/${file.id}`} className="admin-link">
                      {file.kind === "cv" ? "Download CV" : `Download ${file.fileName}`}
                    </a>
                    <p className="admin-note" style={{ margin: "4px 0 0" }}>
                      {file.fileName} · {Math.ceil(file.sizeBytes / 1024)} KB
                    </p>
                  </div>
                </div>
              ))}
            </section>

            <section aria-label="Internal notes" className="admin-card">
              <h2 className="admin-kicker">Internal notes</h2>
              {!notes.length && <p style={{ margin: 0 }}>No notes yet.</p>}
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 14 }}>
                {notes.map((note) => (
                  <li key={note.id}>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{note.note}</p>
                    <p className="admin-note" style={{ margin: "6px 0 0", overflowWrap: "anywhere" }}>
                      {note.adminEmailSnapshot} · <ViewerDate iso={note.createdAt.toISOString()} />
                    </p>
                    {note.adminUserId === admin.userId && <DeleteNoteButton applicationId={app.id} noteId={note.id} />}
                  </li>
                ))}
              </ul>
            </section>

            <DeleteApplicationControl applicationId={app.id} reference={app.reference} />
          </details>
        </aside>
      </div>
    </section>
  );
}
