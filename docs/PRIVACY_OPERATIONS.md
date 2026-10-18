# Recruitment privacy — manual owner operations

Owner-approved on 18 October 2026. This is an operational checklist, **not automated
retention enforcement**. The portal owner is accountable and may assign a trusted
existing internal administrator to perform reviews; no new account/role is needed.
Keep any request/retention register owner-controlled, access-restricted and outside
git, application logs, shared screenshots and chat. Record minimal references,
decisions and completion dates, not copies of applicant answers/CVs.

## Contacts and requests — every business day

- Monitor **hr@fixenmedia.com** for recruitment/privacy requests. General contact:
  **contact@fixenmedia.com**. Backup for all recruitment: **hiring@accoraze.com**,
  not exclusively Accoraze vacancies. Verify mailbox routing/monitoring in the
  owner's mail provider before intake; no mailbox login/delivery test is claimed.
- Approved contact address: **Textile, Bayezid, East Nasriabad, Chittagong,
  Bangladesh, 4209**. Never substitute an unconfirmed address/email.
- Log request received date, minimal application reference, request type, assigned
  administrator, necessary identity verification and applicable statutory deadline.
  Do not ask for passwords, authenticator codes or unnecessary identity documents.
- Review access/correction/withdrawal/deletion requests against the policy and
  applicable law using authorized manual handling. Scope any necessary private
  maintenance separately. Communicate manually using the approved mailbox.
- For approved deletion use the existing MFA-gated application deletion UI; verify
  associated files/quarantine cleanup completes and retry its authorized cleanup
  if needed. Do not delete an entire job, bucket or unrelated candidate record.

## Retention review — every Monday and Thursday

The owner records the actual recruitment closure date and a deletion deadline in
the protected register when closing a recruitment process. `jobs.closed_at` can
help, but reopening a job must not silently erase a recorded retention deadline.
Review deadlines **at least 14 days ahead** and complete eligible deletions before
the limit, or schedule a dated owner reminder before it. If a review is missed,
catch up immediately; no grace period extending the approved limit is implied.

| Record | Owner action |
|---|---|
| Active application | Retain while recruitment remains active; review necessity and privacy requests |
| Closed/unsuccessful recruitment | Delete no later than 12 months after process closure, unless a documented policy exception applies |
| Successful candidate | Minimize any necessary transfer to authorized employment/engagement records; those systems/processes are outside this portal |
| General technical/security logs | Normally at most 90 days; verify actual Vercel/Supabase/Cloudflare/mail/integration settings and oldest retained data. Use supported expiry/deletion controls; unavailable controls remain a launch blocker, not a claimed setting |
| Administrative/legal records | Record the specific necessity/exception and review/end date; no indefinite blanket exemption |
| Downloaded CVs/PDFs | Ask authorized reviewers to remove unnecessary local/shared copies and record confirmation; do not keep duplicate CVs in the request register |

All allowlisted admins are the same small trusted internal team. Internal access
and sharing follow recruitment-related need-to-know practices.

## Backups, logs and evidence — weekly, plus before approved live changes

- Owner reviews the newest successful encrypted backup, both independent copies,
  recoverable keys, inventory and overdue expiry/deletion actions each Monday.
  Run the existing protected backup workflow on the owner-approved cadence and
  after approved schema/security conversion; do not invent scheduled automation.
- Confirm and record an actual backup rotation/end-date policy before real intake.
  The earlier 14-day backup-retention/RPO/RTO targets were proposals, not proof of
  an operating schedule. Do not destroy existing verified G/J recovery evidence
  without a safe replacement, independent copy verification and owner approval.
- Carry deletion requests forward when restoring a backup: reapply deletions and
  access/session retirement **before** making recovered services accessible. A
  recovery must not resurrect the seven retired development sessions.
- Verify actual provider log retention/redaction and exported-log destinations.
  Exclude applicant payloads, name/email query filters, passwords and tokens; review
  logging integrations as well as application logging.
- Record only dates, operator, target, deletion counts, non-secret IDs/hashes and
  outcomes. Legal holds require a specific reason and next review. The owner
  reviews exceptions monthly and closes them when no longer justified.

## Publication and launch boundary

The owner directed a current-processing-only policy with 44 sequential sections,
preserving the approved contacts, address, dates and applicable retention decisions.
Manual retention is disclosed within the policy. This does not verify mailbox delivery, provider
retention/commercial licensing or deploy the page. The narrow Privacy-only release
does not require environment-variable changes or authorize full production conversion.
Synthetic production submission and real intake remain separate explicit gates.
