# Existing-project production conversion — owner runbook

Status: **Preparation only; local TLS gate passed. NOT approved for live conversion or recruitment.**
Owner-selected target: `xmtoccukridshadnxrlc`, Mumbai; Vercel region `bom1`.
No new project, UI redesign, applicant account, role system or real job publishing.
This plan supersedes older instructions to create a separate production project.
The Prompt 16 audit is the owner/agent conversation immediately preceding Prompt 17;
its findings are reconciled below, not treated as already remediated.

## 1. Baseline and evidence boundaries

- Fetched main on 2026-10-17: `8072afe`, merging cleanup PR #8. Dedicated branch
  `production-conversion-hardening`, separate feature worktree; other four worktrees
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
- Earlier default-trust probes failed `SELF_SIGNED_CERT_IN_CHAIN`. The subsequent
  owner-authorized TLS gate passed for DATABASE_URL (transaction pooler, 6543) and
  DIRECT_URL (session pooler, 5432), using Supabase Root 2021 CA and read-only SQL.
  Both wrong-hostname negative tests failed as required. The peer chain root matched
  the downloaded CA; that root is absent from Node's default trust. No certificate,
  credentials or downloaded file path is stored in this plan. Do not repeat these
  completed probes unless credentials/endpoints/CA change; hosted TLS remains unverified.

## 2. Known access inventory (names/scopes only)

| Access path | Verified / Reported / Unknown | Retirement/verification requirement |
|---|---|---|
| Primary worktree private env | Verified: target credentials, APP_ENV development | Owner remove/replace project credentials, preserve unrelated local work |
| Demo-validation worktree private env | Verified: same target credentials | Same retirement, including test workers |
| career-cleanup / career-validation / career-prod | Verified: no root private `.env*` at inventory | External `--env-file`, inherited shell variables and running processes still need owner review |
| External owner env/password manager/CLI stores/backups | Unknown complete inventory | Owner inspect copies; no secret values in reports |
| `DATABASE_URL`, `DIRECT_URL` | Existing credentials; subsequent CA/hostname-verified local reads passed | Rotate effective passwords/logins; reverify fresh credentials and reject old ones; terminate persistent connections |
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

## 4. Exact configuration profiles (prepare privately; do not activate yet)

Only names and non-secret settings belong here. No certificate body, connection
string, credentials or absolute operator file paths may be committed.

| Setting | Vercel Production | Private owner maintenance process |
|---|---|---|
| APP_ENV | Explicit `production` | Explicit `production` |
| DATABASE_URL | Fresh runtime login, transaction pooler | Approved fresh login for the exact operation |
| DIRECT_URL | Runtime login in direct/session mode for identity validation; **not** privileged migration credentials | Privileged maintenance login in direct/session mode; never transaction pooler |
| DATABASE_SSL_CA | Trusted Supabase CA as actual multiline PEM, server-only Config | Same trusted PEM, quoted multiline value in protected external env file |
| SUPABASE_SERVICE_ROLE_KEY | Fresh server-only Supabase secret API key (variable name retained) | Fresh approved owner key for Storage/API operations |
| UPLOAD_SESSION_SECRET / CRON_SECRET | Fresh independent cryptographic values, >=32 characters | Required by current full server validation, even when unused by the selected command |
| TURNSTILE_SECRET_KEY | Owner-rotated real widget secret | Required by current full server validation |
| NEXT_PUBLIC_SUPABASE_URL | Designated project's public API origin | Same designated project |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Correct public publishable/anon key | Same public configuration; no privileged key here |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | Real widget, approved hostname; never a documented test key | Same public configuration |
| NEXT_PUBLIC_SITE_URL | Exactly `https://careers.fixenmedia.com` before build | Same canonical public origin |
| NEXT_PUBLIC_CONTACT_EMAIL | Owner-approved public recruitment/deletion contact | Same public configuration if supplied |
| DEV_SUPABASE_PROJECT_REF | **Absent**, not a fake ref | **Absent** |
| ALLOWED_SUPABASE_PROJECT_REF | Not required by request handlers | Independently confirm `xmtoccukridshadnxrlc` |
| ADMIN_EMAIL | Not needed | Only if separately approving allowlist maintenance; retain current admin instead |
| VERCEL / VERCEL_ENV | Platform supplies `1` / `production`; do not spoof | Leave absent in local owner CLI |
| RUN_SUPABASE_TESTS / browser fixture flags / DEV cleanup variables | Absent | Absent |

Use Vercel **Secret** type for private keys/password-bearing URLs and Config for
public settings/CA; keep all target-specific private values Production-only.
Review project/team/integration/custom-environment/branch overrides, not just the
visible project default. Never pull Production variables into a worktree.

TLS compatibility review: the same server-only helper supplies the CA string and
`rejectUnauthorized: true` to runtime and maintenance postgres.js clients. Default
hostname verification/SNI is preserved and applies to the configured endpoint's
hostname (the shared pooler host for pooled URLs), not the root CA's name or a
substituted project hostname/IP. Keep prepare:false and existing pool settings.

New offline preparation check passed: the 1,367-byte trusted PEM survives JSON
environment transport and Node's quoted multiline env-file parsing unchanged; the
actual application helper accepts both. A literal backslash-n string is rejected.
Paste real line breaks, including PEM delimiters, into the Vercel value field;
do not supply a filename, base64 encoding, surrounding quote characters in the UI,
or literal backslash-n text. No certificate filesystem tracing or Windows path is needed.
Node 24/Node.js routes support this configuration; the CA is not a NEXT_PUBLIC
variable or Edge/browser module. Vercel documents 64 KB combined environment size
for Node deployments; this CA fits, but the owner's complete environment budget
and deployed value/packaging still require verification. Build/health success and
a cached public page are **not** evidence of an actual hosted DB TLS connection.

## 5. Single ordered Stage 1 checklist — ALL live steps await approval

**Executors:** O-D = owner dashboard/provider access; O-C = owner private CLI/secure
operator. Agent = code/docs/offline checks and redacted evidence review. The agent
does not receive production credentials or acquire dashboard permissions through
this checklist. Any delegated live command needs an explicitly named authorization;
default execution of every privileged operation below stays with the owner.

| Order / authorization category | Executor and exact operation | Required checkpoint / stop condition |
|---|---|---|
| **A1 Freeze** | O-D/O-C: pause automatic deployments, DEV mutation jobs/keepalive, scheduled cleanup and active local workers; protect/disable old reachable deployments and integrations that can write. Keep the catalog empty. | Inventory every secret scope/collaborator/custom login/connection; old deployment env is immutable and does not disappear when project variables are deleted. Unexpected real data stops conversion. |
| **A2 Recovery** | O-D/O-C: choose RPO/RTO, retention, encrypted storage and a maintenance window; create DB **and file-byte** recovery coverage, retain original artifact backup, and rehearse an isolated restore. | Verify hashes, restore row/file counts and MIME/paths, RLS, managed Auth/security-trigger recovery and admin reauthentication. No destructive operation until evidence passes. No hosted project creation or restore over live is authorized. |
| **B Retirement** | O-D/O-C: stage replacement values privately, rotate effective DB passwords/custom login access, replace/revoke DEV secret API keys **and legacy service_role** access, replace upload/cron/Turnstile secrets; revoke all pre-conversion Auth sessions, set new owner admin password and verify existing TOTP control. Terminate old DB/pooler connections; remove target credentials from DEV/preview/CI/worktrees and unwanted integrations. | Prove old DB/API credentials and AAL2 sessions fail, not merely that new ones work. Coordinate any shared underlying role password once for both DB URLs. Do not blindly rotate unrelated signing keys or replace MFA factors; escalate untrusted signing/factor material for explicit scope. Preserve provider account recovery access. |
| **C Fresh owner config + expiry** | O-C: load the profile above from a protected external file, privately verify newly rotated connection paths, and record `issuer-retirement-receipt.json` with verified `lastIssuerStoppedAt` and the source-pinned original `manifestSha256`. | Production source pin/API/both DB targets must match; no DEV pin. Wait **more than two hours plus one minute** after the last possible privileged upload issuer stopped, as well as the original job-removal receipt. The old calendar cutoff/object age alone is insufficient. Unknown issuer/expiry requires supported provider invalidation or a stop. |
| **D Exact Storage cleanup** | O-C: run the owner-conversion dry-run against the original approved backup/manifest; inspect, then add exact apply/confirmation for only the original 16 sidecars and four uploads (or verified unchanged remaining subset). | Original backup/current byte hashes, receipts, zero application/job graph and structural fingerprints must match. New/changed objects or data refuse the operation. Verify zero, preserved structures and an idempotent dry-run. Never run a DEV wipe, broad prefix delete or seed/import. |
| **E Migration 0007** | O-C: inspect fresh ledger/schema/invalid-range count; apply the guarded owner migration only if it is the sole expected pending change. | Match all six historical journaled hashes/timestamps; original 0006 remains unjournaled. Require absent CHECK, zero incompatible rows, verified recovery and a lock/downtime plan. Afterward verify exactly one new 0007 hash/ledger entry, validated CHECK, unchanged data, RLS and Auth revocation triggers. Conflicts/unknown drift/commit uncertainty stop before retry. |
| **F Production configuration + release** | O-D: verify commercial hosting plan/log redaction, disabled signups/minimal Auth redirects, private bucket rules and real hostname-bound Turnstile. Set the exact Production-only profile above; build the owner-reviewed immutable commit as a **Production-targeted** deployment in bom1. O-D/O-C: perform normal owner login + existing TOTP and uncached authorized admin reads to verify hosted DB access. | No production-backed Preview or promotion of a development-built artifact. Confirm release SHA/build target/new env, no configuration fallback, fresh SQL-backed admin reads and generic anonymous/AAL1/stale-session denials. Health/public cache alone does not prove TLS. This step authorizes only owner authentication/read verification, not applicant submissions. |
| **G SSL enforcement** | O-D: only after every authorized client uses verified TLS, inspect Supabase Database Settings > SSL and enable incoming SSL enforcement **only if not already enabled**, during the approved maintenance window. | Provider change may reboot the database. Confirm enforcement state and fresh verified connections from owner maintenance and hosted runtime after any reboot; never transmit a password in a plaintext negative test. Repair trust/host/client issues rather than disabling verification. |
| **H Stabilize/recovery refresh** | O-D/O-C: retain a post-migration/retirement recovery baseline, verify old deployments remain unable to access data, and resume only the reviewed production cron with its fresh secret. | One daily schedule, safe logs/counts and monitoring; an authorized cron call can DELETE and needs inclusion in this approval. DEV cloud mutation jobs remain disabled for this target. Do not restore old credentials to make a workflow green. |
| **Separate gate: synthetic acceptance** | Owner-approved operator: limited real-CAPTCHA synthetic apply/upload in an owner-controlled protected test window, MFA review/status/note/CV/PDF, authorized deletion and complete file cleanup, plus mobile/privacy/metadata checks. | Separate explicit scope/time/data approval, no generic fixture suites or real applicant access during testing; zero residual synthetic data/files afterward. Privacy/contact/retention must be owner-approved. No real vacancies or applicants until **another explicit final go-live decision**. |

Production variables must be complete **before** starting the new release build;
the guards intentionally reject today's shared-DEV settings. Pause Git auto-deploy
before configuration/rotation so an incidental push/merge cannot interleave these
steps. The owner chooses a production-targeted build from this branch/reviewed SHA;
this plan does not authorize a main merge. Vercel variable changes apply to new
deployments only. Do not perform an instant rollback/promotion to an old DEV artifact.
Keep old deployments frozen throughout the upload expiry interval; do not start
new upload issuers or publish roles to test readiness. Do not change working DNS.
Revocation proof must be an authentication/session denial on the intended provider
or application, not a network/TLS failure or deployment-protection wall. Confirm
fresh authorized access on the same path and test old access privately without
recording its credential/cookie value. Keep protected deployment access separate
from the app's MFA/allowlist/session authorization checks.

### Owner command forms (reference only; no execution authorized)

The variables below are private operator selections, not committed absolute paths.
`$ApprovedManifestSha256` must be the independent original source/report pin, never
a newly generated digest chosen to evade a refusal. The cleanup is read-only by
default; the migration command is **not** a dry-run.

```powershell
node --env-file="$OwnerEnvFile" --conditions=react-server --import tsx scripts/cleanup-demo-artifacts.ts --owner-conversion --backup="$BackupDirectory" --sha256="$ApprovedManifestSha256"
# Only after approval and successful inspected dry-run, repeat with:
# --apply --confirm=xmtoccukridshadnxrlc

# Separate approved migration, only after category E preflight:
node --env-file="$OwnerEnvFile" --conditions=react-server --import tsx src/db/owner-setup.ts migrate --apply --confirm=xmtoccukridshadnxrlc
```

The current full server schema requires the private validation variables even for
maintenance that does not use CAPTCHA/cron. Use a fresh owner shell: inherited env
values take precedence over an env file. Do not run base/shell/admin/bucket setup
unnecessarily; retain existing structures, admin identity and MFA. Use the least
privileges compatible with this deny-all-RLS architecture and the exact operation;
runtime auth.sessions reads also need review. No new role/grant is provisioned here.

### Recovery readiness and per-operation rollback

**Recovery is still blocked**, not demonstrated by the local TLS gate. Supabase
managed backup availability/current plan is owner-unverified. Paid daily/PITR DB
backups do not contain Storage file bytes; a public+drizzle-only dump omits managed
Auth state/security triggers, and role passwords may require separate recovery.
The previous scoped artifact backup covers only the deleted test graph/20 files,
not a complete production recovery plan. Use an existing isolated recovery target
or approved local full Supabase stack; bare Postgres alone cannot prove Auth/Storage
and migration 0003 recovery. Agree retention and deletion handling for backups too.

| Operation | Verification before continuing | Rollback / recovery boundary |
|---|---|---|
| Freeze/remove secret copies | Inventory scopes and active issuers; protect old deployments | Resume only authorized clients with fresh production-only values; never restore DEV production access. |
| Credential/key/password retirement | Fresh access works; every retired access path fails; owner recovery available | Revocation/rotation is not safely reversed by re-enabling old keys. Recover with another fresh credential/provider owner access. Do not print/preserve values in shared logs. |
| Session revocation/connection termination | Old cookies denied even at AAL2; old sockets cannot continue | Legitimate admins/clients reauthenticate/reconnect. No resurrection of old session rows; an Auth restore must not re-enable revoked sessions/passwords before access resumes. |
| Exact Storage deletion | Original backup hashes/receipt/ownership and zero unexpected data | Git/DB rollback does not restore bytes. Restore only exact backed-up paths/MIME after separate approval; never automatically resurrect DEMO data. |
| CHECK migration | Expected ledger hashes and data preflight, recoverable backup, lock window | On error inspect committed ledger/constraint before retry; monitor/cancel only the conversion query if blocked. No schema rollback via Vercel; any corrective migration needs review/approval, never edit applied history. |
| Production release/env change | Reviewed commit, exact scope, uncached hosted DB read, MFA and denial checks | Keep intake closed; redeploy a compatible hardened revision with fresh settings. Previous deployments retain old env; instant rollback to historical DEV is unsafe. |
| SSL enforcement/reboot | All intended clients verified, provider recovery access and downtime window | Reconnect/retest after reboot. Default recovery is to repair trusted TLS, not disable enforcement/verification. Any emergency enforcement rollback requires separate owner approval. |
| Backup/restore | Encrypted copies/hashes and isolated rehearsal; recover Auth/config/files together | Never test restore over live. Restoring stale Auth/config may revive retired access: reapply retirement before exposing a recovery environment. Protect/delete backups under approved retention. |
| Cron resume / later synthetic cleanup | Only the intended pending-prefix rule; counts/log redaction | Pause a failing job; use retained backups for any actual data-loss investigation. No automatic broad reconciliation/deletion or applicant-intake rollback. |

### Exact next authorization (one consolidated owner decision)

Approve or withhold **A1–H**, naming the executor for each: owner dashboard and/or
private owner CLI, the reviewed release commit, recovery target/RPO/RTO/retention
and maintenance window. This includes rotation/revocation/termination, only the
unchanged originally approved 20-object cleanup, only expected migration 0007,
Production-only environment activation/release, normal owner MFA/read verification,
SSL enforcement and reviewed production cron resumption. No open-ended database
write permission is requested. Any unexpected state or failed checkpoint stops.

Agent-executable work remains code/docs/offline validation and sanitized evidence
review unless a particular live action is expressly delegated. Do not supply secrets
in chat. **Main merge, DNS, new projects, changed grants/policies/MFA factors, real
job publishing/intake and synthetic applicant submissions are excluded** from this
operational authorization. Synthetic acceptance and real go-live need their own
explicit decisions. If the owner cannot demonstrate recovery or retire privileged
access, stop conversion rather than accepting that risk for convenience.

## 6. Public copy, risks and rollback

Verified neutral empty state is appropriate; do not repopulate the catalog for tests.
Privacy still visibly says **Draft — owner review required**, contact unconfirmed,
no automatic submitted-application expiry. Owner must approve real contact, retention,
backup retention/deletion handling and employer/brand text. Do not invent these or
remove honest draft disclosures to claim readiness.

Accepted residual risks remain: no antivirus/full document parsing, no per-IP
quota beyond Turnstile/session/minimum-time controls, bearer AAL2 session theft
within the 30-day absolute cap. They do not excuse unrevoked historical access.

Stop go-live for failed hosted TLS/restore/credential-denial tests, unknown access owners,
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
