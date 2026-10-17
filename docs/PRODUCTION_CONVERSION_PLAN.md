# Existing-project production conversion — owner runbook

Status: **Stage 0 code only; NOT approved for live execution or recruitment.**
Owner-selected target: `xmtoccukridshadnxrlc`, Mumbai; Vercel region `bom1`.
No new project, UI redesign, applicant account, role system or real job publishing.
This plan supersedes older instructions to create a separate production project.
The Prompt 16 audit is the owner/agent conversation immediately preceding Prompt 17;
its findings are reconciled below, not treated as already remediated.

## 1. Baseline and evidence boundaries

- Fetched main on 2026-10-17: `8072afe`, merging cleanup PR #8. Dedicated branch
  `production-conversion-hardening`, worktree `G:\career-prod`; other four worktrees
  and their user changes are preserved. No private env file copied into this worktree.
- Verified 17:30 UTC by HTTPS count-only/read-only requests: 6 departments, 8 brands,
  13 options, 1 allowlist row; 0 jobs/questions/applications/answers/attachments/notes/
  events. Private applications bucket 10 MB; public brand-assets 1 MB. Pending:
  **20 objects: 16 sidecars and 4 uploads**. No deletion performed.
- Verified: public signups disabled. Both public domains return 200, CSP references
  this project, neutral empty state, zero role links, no old hiring-frequency promise.
  The actual Vercel deployment SHA and server variables are **Unknown**: public
  behavior and a merged PR are not proof of a particular deployed release.
- Prompt 16 verified 13 RLS-enabled tables/no public or Storage policies, one admin
  with verified TOTP, seven AAL2 sessions, six matching migration hashes and absent
  salary constraint. Session/catalog/ledger state was not freshly re-read over SQL
  in Stage 0 because verified TLS failed; recheck privately before any application.
- Both fresh certificate-verified DB probes failed `SELF_SIGNED_CERT_IN_CHAIN`.
  No plaintext or `rejectUnauthorized:false` retry was used. Obtain the correct
  server CA from Supabase Database > Settings > SSL; investigate the chain if it
  still fails. A CA value's presence is not proof of successful TLS.

## 2. Known access inventory (names/scopes only)

| Access path | Verified / Reported / Unknown | Retirement/verification requirement |
|---|---|---|
| `G:\career\.env.local` | Verified: target credentials, APP_ENV development | Owner remove/replace project credentials, preserve unrelated local work |
| `G:\career-mr\.env.local` | Verified: same target credentials | Same retirement, including test workers |
| career-cleanup / career-validation / career-prod | Verified: no root private `.env*` at inventory | External `--env-file`, inherited shell variables and running processes still need owner review |
| External owner env/password manager/CLI stores/backups | Unknown complete inventory | Owner inspect copies; no secret values in reports |
| `DATABASE_URL`, `DIRECT_URL` | Verified existing DEV URLs; new verified-TLS probes failed trust | Rotate both effective passwords/logins; test old credentials, terminate persistent pooler/direct connections |
| `SUPABASE_SERVICE_ROLE_KEY` | Verified existing secret/API credential in local files | Replace/revoke all DEV secret keys; inventory legacy service_role separately |
| Legacy service_role/JWT signing keys/other API keys | Unknown complete set | New secret keys do not revoke legacy keys; owner explicitly disable retired legacy access |
| `UPLOAD_SESSION_SECRET`, `CRON_SECRET` | Verified locally present | Replace independently; retire copies and existing deployments |
| Turnstile pair | Local values are not documented test keys; ownership/allowed hosts Unknown | Owner rotate secret and confirm final hostname/action with actual widget |
| Vercel Production/Preview/Development, branch overrides, old deployments | Public origins verified; secret scopes/old deployment access Unknown | Remove target credentials from every non-production scope; retire/protect old deployments and prevent unsafe rollback |
| GitHub DEV secrets/variables/environments | Workflow names verified; configured/enabled values Unknown | Disable mutation jobs pending isolated DEV; remove target credentials from all DEV aliases |
| GitHub schedules | Source: dev keepalive and opt-in cloud/browser tests | Old workflow revisions must lose target credentials too |
| Vercel cron | Source: one daily pending cleanup, bearer protected | Production schedule/secret/monitoring Unknown; authorized GET deletes stale pending files and is NOT a read-only check |
| Auth sessions/password/MFA | Seven AAL2 sessions and owner TOTP verified by audit, not freshly recounted | Revoke all historical sessions, new strong password, verify owner factor control and recovery |
| DB roles/custom logins/active connections | Privileged access exists; complete ownership Unknown | Review roles/grants; separate least-privilege runtime from owner maintenance; explicitly terminate old connections |
| Supabase/Vercel/GitHub collaborators, PATs, integrations, CLI caches | Unknown | Owner review/revoke unnecessary access; account MFA; no credentials to the agent |
| Signed upload/download capabilities | 20 pending artifacts verified; issued tokens cannot be enumerated from object ages | Freeze issuers, prove expiry separately; Storage signing is independent of Auth key rotation |

Workflow aliases: `DEV_DATABASE_URL`, `DEV_DIRECT_URL`, `DEV_SUPABASE_URL`,
`DEV_SUPABASE_ANON_KEY`, `DEV_SUPABASE_SERVICE_ROLE_KEY`, `DEV_UPLOAD_SESSION_SECRET`,
`DEV_CRON_SECRET`, `DEV_SUPABASE_PROJECT_REF`; enable variables
`DEV_TESTS_ENABLED` / `DEV_KEEPALIVE_ENABLED`. Review repository, organization,
environment and branch-specific scopes; do not print secret-list values.
`DEV_DATABASE_SSL_CA` is the optional certificate alias for a future independently
approved isolated DEV target, never permission to reconnect this production project.

## 3. Code safeguards and constraints

- The designated production ref is source-pinned in `src/lib/maintenance/target.ts`.
  No environment variable may turn it into DEV. DEV API + both DB URLs must match
  a separate independent DEV pin; missing/mislabeled/lookalike/mixed targets fail.
  With no other DEV project, cloud-DEV fixtures/seeds/tests are unavailable, not
  repinned to a fake reference. Old code still needs credential retirement.
- Runtime validates the API and both DB targets too. Production has **no DEV pin**.
  On Vercel, APP_ENV must match Production versus Preview/Development scope;
  production startup requires the final canonical origin and non-test CAPTCHA keys.
- Ordinary `db:migrate` and `seed:base` CLIs are now DEV-only, as are seed/demo/reset/
  wipe/import/validation/test-account/bootstrap commands and fixture storage helpers.
  Production owner writes require independently matching allowed/API/both-DB targets
  plus **both** `--apply --confirm=xmtoccukridshadnxrlc`. Without these flags they
  refuse before I/O; this is refusal, not an implemented migration dry-run.
- `links:generate` remains a guarded public-data read/export, not job publishing.
  Drizzle generation configuration has no cloud credentials; never use kit push.
- All four postgres.js creation sites set `ssl: { rejectUnauthorized: true }`, with
  optional owner-supplied PEM `DATABASE_SSL_CA`. Default hostname validation remains.
  Missing system trust fails closed; insecure URL options/process-wide bypass fail.
  Runtime pool size, prepare:false and reserved-query adapter are unchanged.
- Sitemap is generated at request time using the existing tagged catalog cache.
  Packaging can now run with dummy public settings and **no DB/Auth secrets**; no
  production database is queried during a credential-free build.
- Historical `0006_fix_salary_mode_text.sql` is preserved byte-for-byte and remains
  unjournaled: it contains a data UPDATE and constraint DROP. The generated forward
  `0007_enforce_salary_range_text` adds only the missing CHECK, with journal/snapshot.
  Number 6 is deliberately reserved, not fabricated as applied. The installed
  Drizzle reader uses journal tags/timestamps; tests and kit check verify this path.
  Existing conflicting constraints or invalid rows stop the correction; do not drop
  constraints or normalize records to make it pass. No migration was applied.
- Auth/MFA, RLS/policies, CAPTCHA verification, file validation, consent and upload
  ownership/expiry controls are not relaxed. No additional business module/dependency.

## 4. Gate 1 — one batch approval, not implied by Stage 0

All categories below are **pending explicit approval**. Owner executes privileged
operations privately; agent assistance is limited to the specifically approved scope.

| Category / exact change | Main risk | Prerequisite / verification | Rollback / stop |
|---|---|---|---|
| Freeze local/CI/preview writers and retire environment copies | Loss of test/deploy access | Complete inventory, clean work preserved, no applicants/jobs | Keep intake closed; do not restore DEV production credentials |
| Encrypted DB + Storage backups and isolated restore | Sensitive copies, restore mis-target | Owner storage/retention/RPO/RTO, exact target, protected credentials | Never restore over live for rehearsal; stop without recoverability |
| Exact 20-object cleanup | Irreversible file loss; URL replay | Original manifest/backup hashes, same zero graph/structure, proven expiry | Retain verified external backup; unexpected state stops entire run |
| Trusted CA/SSL enforcement + forward migration 0007 | Downtime/schema incompatibility | Backup, fresh ledger/constraint check, both TLS paths successful | Enforcement may reboot; no TLS bypass; forward corrective migration only |
| DB/API/cron/upload/Turnstile secret retirement, connections and Auth sessions/password | Lockout, missed integrations | Recovery/access owner, staged replacement, old-access denial tests | Restore service with fresh secrets, never re-enable compromised DEV access |
| Production-only env/deployment and platform access hardening | Outage, hidden preview access | Approved release, real widget, plan/log review, no non-production secrets | Compatible hardened deployment with fresh secrets; no old unsafe rollback |
| Limited synthetic submission/admin smoke + deletion | Test data in live project | Separate explicit write approval, TOTP, real CAPTCHA, backups | Remove only synthetic data/files; failure keeps recruitment closed |

**Final recruitment/publishing approval is a separate gate after these checks.**
Do not merge/deploy this branch against unchanged shared-DEV settings: the new
startup safeguards deliberately refuse them. Owner must coordinate the approved
freeze/configuration/release; code review or branch publication is not that approval.

## 5. Ordered execution after approval — non-destructive first

1. Freeze writers and keep zero real jobs. Inventory dashboards and take fresh
   counts/privilege snapshots over verified TLS/HTTPS. Stop if real/unexpected data
   appears. Record the last possible signed-upload issuance; existing job removal
   proves app issuance stopped, not that every privileged issuer was retired.
2. Owner selects RPO/RTO/retention and storage plan. Create encrypted full recovery
   coverage for app DB/ledger/constraints, Auth/security triggers/config and file
   bytes/paths/MIME; independently verify backup hashes and isolated restoration.
   An app-only public+drizzle dump excludes Auth triggers/state. Managed DB backups
   exclude Storage bytes. Cleanup's temporary backup alone is insufficient.
   Rehearse in an existing isolated recovery environment or an owner-approved
   local Supabase stack; no hosted project creation is authorized. Bare Postgres
   alone does not prove recovery of managed Auth/Storage and migration 0003.
3. Supply the CA privately in an external owner env file. No DEV pin. Validate both
   DB URLs with certificate/hostname verification. Stop on trust/hostname failure;
   obtain the exact correct CA instead of suppressing errors. Use direct or session
   pooler for migrations/exports, not transaction mode. Owner may enable provider
   SSL enforcement only after approval and a downtime plan.
4. Recheck original cleanup manifest/receipt/backup/current exact objects. The
   previous app-bound earliest cutoff is 2026-10-17 17:58 UTC; if other issuers could
   issue URLs later, prove their retirement plus two hours/margin or seek provider
   invalidation. Do not infer revocation from deletion or Auth/API-key rotation.
   The owner-conversion command additionally requires a private
   `issuer-retirement-receipt.json` in the backup directory, with
   `lastIssuerStoppedAt` (verified UTC timestamp) and `manifestSha256` equal to the
   source-pinned original digest. Do not invent a timestamp. If privileged DEV
   keys could still mint URLs, first execute their approved retirement from step 7,
   then wait the full TTL/margin and record evidence; this dependency takes priority
   over cosmetic step order. The command verifies expiry after both receipts.
5. Run the separate source-pinned owner cleanup path, dry-run first. The legacy DEV
   command remains prohibited. Example **only after Gate 1 approval** from this branch:

   ```powershell
   node --env-file="C:\secure\careers-production.env" --conditions=react-server --import tsx scripts/cleanup-demo-artifacts.ts --owner-conversion --backup="C:\Users\Hossa\AppData\Local\Temp\opencode\task15-evidence\backup-20261017" --sha256=be450f62a44746f6577161fde41fb1972eb1e164bf723f487e9cd65bb17e2562
   # Inspect dry-run; same command plus --apply --confirm=xmtoccukridshadnxrlc
   ```

   All original scope/hash/expiry/dependency checks remain. New objects/jobs/
   applications or structural changes stop cleanup. Verify zero and rerun dry-run.
6. Reconcile fresh ledger hashes and constraint definition before the approved
   migration. If it no longer matches the audit, stop and review; never fake a
   ledger entry. In a fresh shell using the owner file:

   ```powershell
   node --env-file="C:\secure\careers-production.env" --conditions=react-server --import tsx src/db/owner-setup.ts migrate --apply --confirm=xmtoccukridshadnxrlc
   ```

   Recheck ledger/constraint/RLS/revocation triggers. Do not run base/shell/admin/
   bucket creation unnecessarily: existing structural records/admin/buckets remain.
7. Retire DEV credentials under the approved rotation plan: DB passwords/custom
   logins, secret keys **and legacy service role**, upload-session/cron secrets,
   Turnstile secret, seven/all historical Auth sessions and old admin password.
   Confirm owner TOTP control; retain the factor only if its secret is trusted.
   Terminate DB/pooler connections. Test **old** DB/API/session access is rejected.
   Do not paste old or new credentials into commands/logs/chat; use protected files.
8. Owner configures Vercel Project > Settings > Environment Variables: fresh secrets
   in **Production only**, remove target keys from Preview/Development/branch overrides.
   APP_ENV=production; DEV_SUPABASE_PROJECT_REF absent; final site origin explicit;
   API/both DB URLs point to the designated ref; CA provided as multiline PEM.
   Owner maintenance file additionally has ALLOWED_SUPABASE_PROJECT_REF set to the
   actual ref, independently checked in Supabase. Vercel's Production label alone
   does not retire DEV access or prove APP_ENV/security/credential correctness.
   Keep privileged migration credentials out of Vercel: its DIRECT_URL may use the
   runtime login in session mode for identity validation; the external owner file
   supplies the separately approved maintenance login. Review minimum grants against
   the deny-all-RLS model/auth.sessions reads before changing roles; no new role or
   privilege is automatically provisioned by this code and least privilege is not
   claimed verified without the owner's grant inventory.
9. Supabase Authentication > Sign In / Providers: verify signups OFF and only intended
   providers; URL Configuration: final site and minimal intended redirects, no
   development/wildcard redirects. Verify private Storage/MIME/size/RLS independently.
   Cloudflare Turnstile > widget > Settings: approved hostname, no localhost/dev
   hosts; real pair of keys, successful hostname + `careers` action verification.
10. Owner deploys reviewed code to Production (not a production-DB preview). Verify
    exact release, bom1, Linux PDF/fonts/sharp, commercial hosting plan, log/query/
    header redaction and daily cron monitoring. Do not change working DNS/nameservers.
    Authorized cron is a write operation; require approval before invoking it.
11. After the separately approved synthetic write: apply with Bengali answers/CV,
    review with mandatory MFA, status/note/download/PDF, then authorized deletion.
    Verify no anonymous/non-admin/AAL1/stale-session access; zero residual test files,
    correct metadata/robots/noindex/privacy and real-phone behavior. Publish no real
    job and admit no applicant until the owner explicitly approves final go-live.

## 6. Public copy, risks and rollback

Verified neutral empty state is appropriate; do not repopulate the catalog for tests.
Privacy still visibly says **Draft — owner review required**, contact unconfirmed,
no automatic submitted-application expiry. Owner must approve real contact, retention,
backup retention/deletion handling and employer/brand text. Do not invent these or
remove honest draft disclosures to claim readiness.

Accepted residual risks remain: no antivirus/full document parsing, no per-IP
quota beyond Turnstile/session/minimum-time controls, bearer AAL2 session theft
within the 30-day absolute cap. They do not excuse unrevoked historical access.

Stop go-live for failed TLS/restore/credential-denial tests, unknown access owners,
unexpected data, lingering test objects, test CAPTCHA keys, draft privacy, unsafe
preview scopes, failed production smoke or unsuitable hosting. No fundamental
new-project requirement has been established; reassess Option B only if isolation/
access retirement/recovery cannot actually be achieved.

Rollback before live operations: leave this branch unmerged/undeployed. After
rotation/conversion: use only a compatible hardened deployment and fresh secrets,
keep intake closed, use forward fixes. Code rollback cannot restore deleted files,
undo migration or make old compromised keys safe. Never roll back to DEV guards
with production credentials. Restore data only through the separately rehearsed,
owner-approved recovery process.
