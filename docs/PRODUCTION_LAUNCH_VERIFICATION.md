# Production conversion verification

## Prompt 20 — complete approved Privacy implementation (newest)

The owner approved the full supplied 48-section policy and finalized its public
contacts/address/retention, then explicitly authorized implementation, checks,
commit and push on the existing feature branch. **No approval to deploy the new
application revision is implied.** Prior 36594bf release approval does not cover
this code change. The final code commit SHA is returned in the execution handoff.

### Completed in this batch

- `/privacy`: all 48 numbered sections, paragraphs, subheadings, bullets, multi-brand
  disclosures and 18 October 2026 dates preserved. Independent comparison to the
  owner source matched every section after approved contact edits. A canonical
  normalized-text SHA-256 test pins the complete text; no truncation/template swap.
- Approved contacts: primary **hr@fixenmedia.com**, general **contact@fixenmedia.com**,
  backup **hiring@accoraze.com** for all recruitment. Approved address: **Textile,
  Bayezid, East Nasriabad, Chittagong, Bangladesh, 4209**. No bracketed address,
  unconfirmed privacy mailbox, prohibited Gmail address or draft notice is served
  by the new code. Mail-provider delivery/monitoring is owner-only, not agent-tested.
- 1100px maximum shell; 76ch text additionally capped at 740px; 16px/1.85 body text;
  semantic headings/dates, native collapsible contents and all 48 keyboard anchor
  targets; shared public header/footer unchanged. Raw HTML remains disabled through
  the existing sanitizer/Markdown renderer. No dependency, schema or auth change.
- Explicit public operational note: retention is manual, not automatic; talent-pool
  opt-in, AI candidate evaluation and optional analytics are not implemented. The
  policy's conditional future descriptions are preserved, not activated as features.
- PRIVACY_OPERATIONS.md assigns the portal owner business-day request monitoring,
  Monday/Thursday deletion-deadline review, weekly backup/log review and monthly
  exception review. It covers files/quarantine, exported CV/PDF copies, closure-date
  preservation, policy exceptions, backups and reapplying deletions/access retirement
  after restore. No automatic deletion/notifications or actual provider settings
  are claimed. Production public contact should be hr@fixenmedia.com before rebuild.
- Prompt 20 owner reports fresh-window password/existing-TOTP login and Dashboard
  refresh succeeded. Retain that as **owner-attested hosted evidence**, alongside
  the actual seven-session revocation and 7/7 provider refresh denials below; no MFA
  reset/re-enrollment/session revocation repeated. Existing G/J recovery retained.

### Verification

| Check | Result / boundary |
|---|---|
| Typecheck/lint | PASS, including final optimized build's type/lint checks |
| Default suite | **777 passed, 90 existing opt-in skips**; no cloud mutations |
| Focused policy/form/preview tests | **10 passed**; complete canonical text/dates/contacts/48 anchors plus actual consent/footer link markup |
| Optimized Next build + PDF trace | PASS; credential-free, APP_ENV=development/offline API placeholder, no DB/Auth secrets or live DB read |
| Production-mode local Chromium | **4 passed**: full server-rendered policy/footer navigation, keyboard contents/anchors, no horizontal overflow at 320/390/768/1440, width/line-height bounds, public fallback/success and anonymous admin API/cron denials |
| Visual inspection | 390px/1440px policy viewport captures inspected; readable glass layout; screenshots remain ignored |
| Source/remote baseline | Fetched main still 8072afe; reviewed old pin still 36594bf, later published HEAD 8e3ed10 was documentation-only before this code batch |

First policy unit attempt exposed the unit runner's unrelated CSS/PostCSS loader
incompatibility; CSS is mocked only in markup tests and actually tested by Next /
Playwright. First browser attempt found ambiguous shared-footer email selectors and
a font-dependent 76ch paragraph wider than the 800px test bound. Selectors now scope
to main, and real CSS adds a 740px cap. Rebuilt and all four browser cases passed;
no assertion was weakened. Existing Vite future-loader warning remains non-failing.

No ordinary cloud/browser account fixtures, real CAPTCHA solve, application
submission, Storage deletion, 0007 application, credential rotation, production
env activation, merge or deployment ran in this batch. No applicant data used.

### Single remaining owner-only provider checklist

1. **Vercel project > Settings > Cron Jobs / Environments / Git; Deployments;
   team Members/Integrations, and GitHub > Actions / Settings > Secrets and variables:**
   finish writer/old-deployment freeze, privileged access inventory and Production-only
   credential replacement/removal from DEV/Preview/CI/local copies. Supabase > Database
   > Settings and Settings > API Keys: rotate supported remaining privileged access
   privately and prove old denials/fresh access. The already retired seven sessions
   are not a reason to reset the owner password/factor or repeat that work.
2. **Owner protected CLI:** record genuine final upload-issuer retirement, wait
   strictly >2h1m, then run existing original-manifest guarded cleanup dry-run/apply
   for only the eligible ten objects. Recheck ledger/data, apply sole 0007 through
   owner migration command, and verify CHECK/ledger/counts/RLS. No receipt invented.
3. **Cloudflare > Turnstile > widget Settings; Supabase > Authentication > URL
   Configuration; Vercel > Settings > Environment Variables; team Billing / project
   Logs; owner mail provider:** verify real hostname/key pair, minimal redirects,
   fresh Production-only canonical env/CA, commercial use, log TTL/redaction and
   approved contact mailbox monitoring. Follow PRIVACY_OPERATIONS.md; log/backup
   retention availability is not proven by policy approval.
4. **New immutable application release approval:** review the tested policy commit
   reported in the handoff, not merely 36594bf or moving branch HEAD. Only then build /
   deploy for Production/bom1, verify uncached hosted SQL/TLS and existing owner MFA,
   then Supabase > Database > Settings > SSL Configuration: enable enforcement only
   after all clients pass and recheck after restart. No historical DEV rollback.
   Record CI/deployment IDs, refresh protected recovery as feasible and resume only
   reviewed production cron/monitoring.
5. **Recovery/intake boundary:** owner confirms Supabase Free has no provider-managed
   project backups. Portable G/J DB/file recovery PASS does not establish managed
   Auth/MFA-key/config/service recovery; document/resolve the remaining critical
   limitation through the existing owner gate, without claiming unavailable provider
   capabilities or silently accepting risk. Controlled synthetic acceptance requires
   separate authorization after deployment/security pass; real intake requires its
   own final approval. No real recruitment has been opened by this batch.

The earlier checklist/status tables below are historical where superseded by this
entry. Policy **implementation/owner approval PASS**, hosted publication **BLOCKED**;
full access retirement, Storage cleanup, 0007, hosted TLS/enforcement, real CAPTCHA,
commercial hosting/provider controls and production deployment remain **BLOCKED**.
Synthetic production acceptance remains **NOT AUTHORIZED**.

## 2026-10-18 — Final launch execution checkpoint (current)

**Not production-ready. Portable encrypted database/Storage recovery passed;
managed Supabase service recovery remains unverified. Prompt 19 operational
conversion and separate pinned merge/deployment are now explicitly approved for
the owner private operator, conditional on existing gates. Only the specifically
delegated session revocation below has executed; other live changes remain pending.
Synthetic submission and real intake remain unapproved.**
This checkpoint supersedes historical statuses below, not their evidence.

### Scoped admin session transition — executed 2026-10-18 11:53 UTC (latest)

- Owner attests successful custom-domain login using the existing password/TOTP.
  The subsequent instruction explicitly delegates scoped revocation if authorized
  server-side access is available; no merge/deploy or unrelated rotation requested.
- Privately recovered the exact seven historical session IDs from the retained
  protected backup, in memory only. Verified all seven still existed for the sole
  allowlisted owner, with exactly one additional current, unexpired AAL2 session
  issued after the recovery baseline. Verified session DELETE privilege over strict
  CA/hostname-validated session-pooler TLS. No session IDs/tokens/keys printed.
- At **2026-10-18T11:53:24.564Z**, explicit-target guarded transaction removed only
  those seven sessions, excluding the current session. Immediate independent
  postcommit reads: **0 historical session rows, 0 associated refresh-token rows,
  current AAL2 session preserved**. Full account/allowlist/MFA-record fingerprints
  are unchanged before/after. Existing password and verified TOTP retained.
- At **2026-10-18T11:53:54.384Z**, provider authentication rejected refresh attempts
  using one previously unrevoked backed-up credential from each historical session:
  **7/7 actual authentication denials**, not network failures. Credentials and raw
  responses remained in memory; none logged. No replacement session was issued.
- **Not verified:** old browser-cookie rejection on the live custom domain and
  fresh password/TOTP login after revocation. Owner must keep the current verified
  window open, hard-refresh its Dashboard, and use a separate fresh browser session
  for the password/existing-TOTP challenge and Dashboard check. Pre-revocation owner
  login is attested, not agent-observed. Current live deployed SHA remains unknown;
  JWT expiry alone is not immediate application revocation evidence.
- No account/factor/allowlist deletion, password/DB/API credential rotation,
  configuration/migration/Storage mutation, merge or deployment. Other production
  access retirement and upload-issuer expiry are still incomplete. Earlier entries
  saying seven sessions remain/no live changes are historical, superseded here.

### Prompt 19 approval and incremental execution (latest)

- Read all 82 lines of the owner-authored prompt from the primary worktree; did
  not copy/edit it or restart completed audits. In one interactive checkpoint the
  owner selected **Authorize operational batch** and, independently, **Authorize
  pinned merge/deploy**. Target is `xmtoccukridshadnxrlc`; immutable release is
  `36594bf0a1758a4b35a6ff21b6a8972622f0f3b2`. Executor for authenticated provider
  changes/private CLI writes is the owner; agent coordinates/checks redacted evidence.
- Approval covers the listed B–H sequence and conditional enforcement, not agent
  custody of production credentials, changed MFA factors/grants/policies, synthetic
  submissions, real intake or a recovery-risk waiver. No repeated approval is needed
  for this exact scope; unavailable access/evidence is now the execution blocker.
- Independently read both G/J accepted ciphertext sets again without decryption:
  pinned index matches `f4a59c655b50fd121f8f725644a0643da51334f8df2c200b7665a36ec25b6f8a`
  and **all 17 ciphertext entries per copy hash-match**. Prior two-copy decryption
  and isolated restore evidence retained; no new export, restore or key generation.
- Official provider instructions corroborate Supabase Settings > API Keys legacy
  deactivation is separate from creating replacement keys; Database Settings > SSL
  enforcement may reboot; Vercel Settings > Cron Jobs > Disable Cron Jobs freezes
  the scheduled writer. None of those dashboard actions was executed by this agent.
- First blocked operation remains owner/provider recovery/access evidence and the
  approved freeze/retirement. No genuine cutoff/retirement receipt exists, so no
  cleanup or 0007 apply. No hosted configuration/build/deployment ID or CI result
  is available. No further infrastructure, tests or repeated source audits added.

### Owner action sheet — execute once, in order

All steps use the existing project, owner account and private terminal. Record UTC,
operator, target, PASS/FAIL and non-secret IDs/counts after each change; no secrets,
cookies or raw connection strings in chat. Do not use Vercel environment pull.

1. **Recovery/access/freeze:** Supabase project > Database > Backups: inspect actual
   recovery point/coverage and obtain provider-supported Auth/MFA-key/config recovery
   validation. Existing portable PASS does not clear that gate. Review organization
   members and integrations. Vercel project > Settings > Cron Jobs > **Disable Cron
   Jobs**; Settings > Git / Environments: prevent unintended auto-deploys; Deployments
   / Deployment Protection: freeze/protect old write-capable releases. GitHub >
   Actions: disable the two DEV workflows; Settings > Secrets and variables > Actions
   (plus Environments/organization secrets): inventory production-target access.
2. **Private B/C retirement:** Supabase > Database > Settings: replace DB access
   credentials; Settings > API Keys: create replacement secret/publishable keys as
   needed, validate current clients, retire old secret keys and separately deactivate
   legacy keys where supported. Preserve the existing administrator/verified factor;
   prove replacement owner MFA access before retiring historical sessions. Execute
   supported private session revocation and obsolete connection termination, then
   test actual old authentication denials alongside fresh successful access. Retire
   upload/cron secrets and all DEV/Preview/CI/unneeded local copies. Account for every
   privileged issuer; record the actual last-possible-issuance UTC in the existing
   source-pinned receipt. Wait strictly more than 2h1m. Do not fabricate a receipt.
3. **D/E private CLI:** with protected fresh owner env and the original approved
   manifest/backup, run the existing owner-conversion cleanup dry-run command in
   PRODUCTION_CONVERSION_PLAN section 5. Inspect it, then repeat with exact apply/
   confirmation. Verify zero objects/job/application graph and preserved structure.
   Recheck migration state immediately, then use the existing guarded owner migrate
   command for sole pending 0007. Verify one new ledger entry, validated salary CHECK,
   unchanged counts/RLS/security triggers. Stop on drift or ambiguous commit.
4. **F business/configuration:** Cloudflare > Turnstile > existing widget > Settings:
   verify `careers.fixenmedia.com` and real paired keys. Supabase > Authentication >
   URL Configuration: canonical Site URL and minimal exact redirects (no unnecessary
   DEV/Preview wildcard); retain disabled signups. Vercel > team Settings > Billing:
   verify commercial-use entitlement; project > Logs: inspect actual privacy controls.
   Provide authentic public contact/deletion email, retention period and privacy
   approval; no invented policy. Vercel project > Settings > Environment Variables:
   activate the Production-only profile in VERCEL_ENV_TABLE/conversion plan; remove
   target credentials from Development, Preview, branch/custom/integration overrides.
   DATABASE_SSL_CA is actual multiline PEM with hostname verification intact.
5. **F release/G/H:** owner uses the approved merge/release workflow and proves the
   built application is pinned to 36594bf, not moving documentation HEAD. Vercel >
   Deployments: build explicitly for Production/bom1 with fresh Production variables;
   do not promote a DEV-built artifact. Record commit/CI/deployment IDs. Verify normal
   owner MFA and uncached SQL-backed reads over verified TLS, then Supabase > Database
   > Settings > SSL Configuration > Enforce SSL on incoming connections, only if
   needed after every client passes. Recheck all clients after restart. Refresh the
   recovery baseline as feasible and resume only reviewed production cron/monitoring.
   Never roll back to historical DEV configuration or resurrect retired credentials.

Final privacy source changes need a separately reviewed release pin before intake.
After B–H actually pass, synthetic acceptance and real intake each require their
own later explicit approval. No real recruitment is opened by either approval above.

### Executed in this continuation

- Fetched origin: main remains `8072afe9f5d1404798d6458a1d69fb8d5689b887`.
  Reviewed release remains `36594bf0a1758a4b35a6ff21b6a8972622f0f3b2`;
  feature HEAD before this report is `8e3ed10`. Its four later commits change
  documentation only (recovery results/instructions); no release substitution.
  Historical SQL 0000–0006 remains byte-identical to fetched main.
- Existing read-only audit over CA/hostname-verified session-pooler TLS: zero
  jobs/applications; six ledger hashes/timestamps match, 0007/CHECK absent,
  zero incompatible salary rows. All 13 public tables have RLS, no public/Storage
  policies, both Auth security triggers present. No migration or ledger write.
- All ten remaining objects (six sidecars/four uploads) match original metadata
  and downloaded SHA-256/lengths; all 20 original backup artifacts hash-verify.
  Structural fingerprints unchanged: six departments/eight brands/13 options/
  one legitimate allowlisted Auth user. Issuer-retirement receipt still absent:
  no cleanup invocation/deletion or invented last-issuance cutoff.
- One allowlisted administrator has verified TOTP; seven historical sessions
  remain, all AAL2. Eight other DB client backends were observed, not attributed
  to obsolete operators and not terminated. No authentication/factor/session write.
- Fresh public Auth settings confirm signups disabled. Count-only anonymous HEAD
  reads return zero rows for all 13 application tables. Applications bucket private.
- Custom-domain home/privacy/login/health return 200; unauthenticated daily cron
  returns 401. HSTS/CSP present, homepage has zero job links. Privacy remains a
  visible owner-review draft. Public cache MISS/health is not hosted SQL/TLS proof.
- No management MCP resources, provider CLI or management token available in this
  process. Provider memberships, env scopes, deployed SHA, SSL enforcement,
  Turnstile hostname/solve, redirects, commercial hosting and logs remain unverified.
  No browser-token extraction or production env download attempted.

### Execution report

| Component | Status | Evidence |
|---|---|---|
| Database and Storage recovery | PASS (portable only) | Existing independently decrypted G/J copies and isolated PG18 restore below; no repeat export/restore |
| Historical access retirement | BLOCKED | Approved for owner; seven historical AAL2 sessions remain, private execution/old-access denial proof absent |
| DEMO Storage cleanup | BLOCKED | Ten unchanged authorized objects verified; genuine issuer retirement/expiry not evidenced |
| Migration 0007 | BLOCKED | Sole prepared forward CHECK; six-entry ledger consistent, zero invalid rows; owner execution pending |
| Production environment | BLOCKED | Fresh Production-only settings and DEV/Preview/CI credential removal not activated/verified |
| Verified TLS and SSL enforcement | BLOCKED | Local verified TLS succeeds; hosted uncached SQL and provider enforcement not verified |
| Real CAPTCHA | BLOCKED | Real hostname configuration and protected live solve not verified |
| Admin MFA | BLOCKED | Verified owner factor exists; normal owner login on hardened release and retired-session denial pending |
| Privacy and hosting | BLOCKED | Live privacy draft; owner contact/retention and commercial hosting/log checks pending |
| Production deployment | BLOCKED | Separate pinned merge/release approval recorded; provider execution and deployed-SHA/CI evidence absent |
| Final synthetic acceptance | NOT AUTHORIZED | No test job, submission, upload, status/note mutation or PDF workflow executed |

### Pre-approval checklist (historical; superseded by Prompt 19 action sheet above)

1. Review access/memberships/integrations, old deployments and all env/CI scopes;
   corroborate freeze and missing-sidecar history. Verify existing-project managed
   Auth/MFA-key/config recovery coverage and supported validation; portable PG18/file
   recovery is not complete managed recovery. Preserve backups/keys and owner MFA.
2. Confirm public contact/retention/privacy wording, Auth redirects, real Turnstile
   hostname and commercial hosting/log privacy. No business policy is invented.
   Publishing final privacy copy requires a small separately reviewed source change
   and release pin before real intake; do not silently replace the reviewed SHA.
3. Give **one explicit conditional conversion approval**, naming the owner private
   operator and reviewed SHA: credential/session/connection retirement with fresh
   access and old denials; Production-only env activation and DEV/Preview/CI/local
   copy retirement; sole 0007; merge and Production deployment; SSL enforcement
   only after all clients pass verified TLS. Existing recovery/security gates remain
   mandatory; approval is not evidence they passed. Migration remains owner-run.
4. In that approved window follow the existing ordered runbook, not a new plan:
   retire issuers → record actual cutoff → wait strictly more than 2h1m → exact
   scoped cleanup → 0007 → Production build/release → owner MFA/uncached SQL →
   enforcement/postcheck. Never resurrect historical DEV credentials/deployments.
   Synthetic acceptance and final real intake each need separate later approval.

Only this report and the decisions log changed. No application change or live
mutation was made. Previous build/PDF trace/non-mutating browser evidence remains
applicable to unchanged source; no ordinary cloud/browser fixture suite was run.
Final local checks in this continuation: typecheck/lint PASS; 773 tests PASS with
90 existing opt-in skips; Drizzle metadata check and `git diff --check` PASS. The
existing non-failing Vite future-loader warning remains. No new build or browser
run was necessary for documentation-only changes; hosted acceptance is not verified.
Documentation remains local/uncommitted; no push or deployment integration triggered.

## Historical Stage 0 checkpoint

The statuses below are historical; use the current checkpoint and completed
portable recovery section rather than interpreting old blockers as missing backups.
Branch: `production-conversion-hardening`, based on main `8072afe` (cleanup PR #8).
Verified code commit: `dd347f3` (guards, TLS, migration preparation and tests).
Authoritative execution/approval matrix: `PRODUCTION_CONVERSION_PLAN.md`.

| Requirement | Status | Actual evidence / boundary |
|---|---|---|
| Preserve worktrees and owner work | Verified | Separate clean feature worktree; four existing worktrees untouched |
| Reconcile audit and cleanup | Verified / Reported | HTTPS counts and public checks at 2026-10-17 17:30 UTC; SQL findings/session count from Prompt 16 audit, not a fresh SQL success |
| Empty catalog; preserved structure/admin | Verified | 0 jobs/questions/applications/dependents; 6 departments/8 brands/13 options/1 allowlist |
| Pending test artifacts | Blocked | 20 remain: 16 reservations, 4 uploads; no deletion executed |
| Signups disabled | Verified | Fresh public Auth settings GET |
| Production-target deny guards | Implemented | Source pin rejects DEV repinning; runtime and startup scope/URL checks; local tests recorded below |
| Owner maintenance confirmation | Implemented | Independently matched allowed/API/both DB targets; no fake DEV ref; explicit apply + exact confirmation |
| Local TLS validation | Verified | Subsequent authorized gate: both paths passed CA/hostname-verified read-only SQL; wrong-hostname tests rejected. No insecure fallback or permanent trust/config change |
| Production TLS configuration | Compatible / Not tested hosted | Actual helper consumes trusted multiline CA through JSON/env-file transport without overriding hostname checks. Owner must activate Production-only value and verify fresh hosted SQL reads |
| Migration reproducibility | Implemented / Read-only preflight verified | Six ledger hashes/timestamps match source, no unexpected entry, 0007 absent, CHECK absent, zero incompatible range rows. Forward migration still NOT applied; recovery/approval required |
| Old credentials/sessions/connections retired | Blocked | Requires explicit owner approval/execution and old-access denial tests; historical seven AAL2 sessions not revoked |
| Backups + isolated restore | Blocked | No production recovery test performed; cleanup backup is insufficient |
| Vercel/GitHub/Supabase scopes/memberships | Blocked | No management access; actual configured scopes/plan/log settings unknown |
| Real Turnstile hostname/action | Not tested | No CAPTCHA solve, secret rotation or configuration change |
| Current public deployment | Verified partially | Both domains 200; neutral empty state/no role links, CSP references project. Exact deployed SHA/server APP_ENV unknown |
| Authenticated production apply/review/PDF/deletion | Not tested | No accounts, sessions, factors, uploads or applications created/changed |
| Final privacy/contact/retention approval | Blocked | Draft and missing-confirmation wording intentionally retained |
| Malware/per-IP quotas/stolen AAL2 bearer sessions | Accepted residual risk | Existing documented limits unchanged; not claimed fixed |
| Final recruitment permission | Blocked | Owner final go-live approval required; no real jobs published |

## Local verification

Final code-only results (2026-10-17; no private env file in this worktree):

| Check | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS; no package/lockfile/dependency change |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | **773 passed / 90 existing opt-in skips; 107 files passed / 8 skipped** |
| `pnpm exec drizzle-kit check` | PASS, including the forward snapshot/journal |
| `pnpm build` | PASS; regenerated after final runtime changes, no DB/Auth secrets |
| Build-integrated PDF trace guard | PASS: Helvetica/chunks/ICC, both Bengali fonts, 8 logos |
| `pnpm exec playwright test --config=playwright.cleanup.config.ts production-hardening-readonly.spec.ts` | **2 passed** against refreshed optimized local build, no fixture lifecycle or privileged credentials |
| Known-current-credential file scan | PASS: 524 tracked/nonignored files, zero matches; not proof about unknown/external credentials |
| SQL history comparison with fetched main | PASS: original 0000–0006 SQL unchanged byte-for-byte |
| `git diff --check` | PASS |

Build/browser processes explicitly stripped credential/environment variables and
used only APP_ENV=development, public origin `http://localhost:3100`, reserved
nonexistent API origin `https://offline.example.invalid`, a public placeholder key
and documented development Turnstile site key. No DEV pin or fake connection
string was used to get past a guard. Browser checks cover the honest **unconfigured**
local fallback/privacy/success and anonymous admin API/cron denials—not a configured
production submission, deployed release or successful TLS connection.

Vite emits a non-failing warning about extensionless imports under a future native
config-loader default. Current installed runner succeeds; warning is not suppressed.
Full cloud suites/ordinary mutating browser fixtures/Lighthouse and live authenticated
flows were not run. No migration dry-run is claimed from a kit metadata check.
GitHub CLI is unavailable, so PR creation and hosted CI status are not verified.

Intermediate evidence: credential-free build/PDF trace and Drizzle check passed.
First full default run had 759 passes/10 failures/90 skips: Turnstile test fixtures
used non-pinned dummy DB URLs incompatible with the new guard. Fixtures now use
correct environment-specific dummy targets; all security assertions are retained.
The targeted 107-case rerun passed. First non-mutating Chromium run was 1/2 because
the new test incorrectly expected an `ok` field in existing API denials; corrected
to the exact existing body (no handler change), then 2/2 passed. Final gates below
will supersede these intermediate results, not erase their history.

Live fixture suites,
ordinary browser global setup/teardown, seeds/sweeps/import/wipe, authenticated cron,
migration execution and synthetic submissions are prohibited in Stage 0.

The isolated feature worktree has no private `.env*`. Build uses dummy public
settings only, never production credentials; dynamic sitemap prevents build-time
DB reads. Non-mutating browser checks must have no account/catalog fixtures and
are not a substitute for final real-CAPTCHA/admin production smoke.

No dependency, applied migration, Auth/RLS policy, secret, environment scope, DNS,
deployment setting or applicant data was changed by this task. Fetch/feature-branch
publication is distinct from owner merge/deployment approval.

## Subsequent TLS gate and non-destructive preparation

The owner supplied the official Supabase Root 2021 CA. The authorized local TLS
gate passed for both transaction-pooler DATABASE_URL and session-pooler DIRECT_URL:
certificate verification, correct endpoint hostname, matching chain root and
read-only SQL. Deliberately incorrect hostnames failed with
ERR_TLS_CERT_ALTNAME_INVALID. Earlier SELF_SIGNED_CERT_IN_CHAIN came from missing
default Node trust, not an invalid server hostname or a reason to disable checks.
The CA is valid through April 2031, has CA/signing constraints, and was not copied
into source or committed; no downloaded file path is recorded here.

New offline preparation verified the actual application's TLS helper with the CA:
1,367 bytes, JSON round-trip and Node quoted multiline env-file round-trip unchanged,
rejectUnauthorized remains true, default hostname verification is not overridden,
and literal backslash-n input is rejected. Official Vercel docs allow certificates
within the 64 KB combined Node environment budget. This establishes source/runtime
configuration compatibility, **not** actual Vercel variable contents, a deployed
Linux connection or SSL enforcement. Production still requires owner activation.

New non-mutating migration preflight, using the same verified TLS helper and a
read-only session-pooler transaction, confirmed six matching historical hashes and
timestamps, no unexpected ledger rows, no recorded 0007, no salary CHECK and zero
incompatible range rows. No DDL/data/schema mutation was executed. This is not a
migration application or backup/restore test; recheck at the eventual execution
boundary if state changes. No inventory, TLS handshake matrix, build or broad suite
was repeated solely to reproduce completed results.

Only documentation changed in this preparation continuation. Verification was the
new configuration-transport check, read-only 0007 readiness check, source/official-doc
review and documentation diff checks; prior typecheck/lint/test/build/browser results
above remain historical, not newly executed. No privileged operation, secret/env
scope change, certificate installation, deployment or merge occurred.

## Owner gate and remaining actions

Use the **single A1–H execution/authorization checklist** in the conversion plan,
not the superseded circular cleanup-before-retirement order. It places access freeze
and proven recovery first, privileged issuer retirement before expiry/cleanup, and
actual hosted TLS verification before provider SSL enforcement. Owner dashboard and
private CLI actions are explicitly separated from agent offline/redacted review.
The later owner decision approves A1/A2 only, pins release candidate
`36594bf0a1758a4b35a6ff21b6a8972622f0f3b2`, and leaves recovery objectives/window
proposed rather than confirmed. Owner retains credentials and backup custody.
B–H are conditionally accepted as sequence only: subsequent execution approval is
required even after prerequisites pass. Do not re-request A1/A2 approval.
This operational batch excludes a main merge, DNS, new projects, changed grants/
policies/MFA factors, synthetic applicants and real job publishing/intake. Limited
synthetic acceptance and final real recruitment require separate explicit approval.
Do not merge/deploy against the current shared-DEV settings: the new guards
intentionally reject them. Coordinate approved freeze, fresh production-only
configuration and release through Gate 1; the existing live deployment has not
been converted by these commits. PR can be opened through the branch comparison;
GitHub CLI/management access was not available to create it here.

Remaining blockers: actual Production-only CA/env activation and hosted SQL proof;
unknown privileged credential/collaborator/scope inventory; historical sessions/connections;
the last-observed 20 pending artifacts and verified issuer retirement/expiry;
complete backup/isolated restoration; real widget/hosting/log
verification; migration application; privacy/contact/retention approval and final
authenticated production smoke. A new production project is not required by current
evidence, but reuse is not safe until those checks actually pass.

References reviewed for preparation: [Vercel environment scope/size/new-deployment
semantics](https://vercel.com/docs/environment-variables), [Config versus Secret
variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables),
[Supabase SSL enforcement/reboot](https://supabase.com/docs/guides/platform/ssl-enforcement),
[database backups and excluded Storage bytes](https://supabase.com/docs/guides/platform/backups).

## Prompt 18 — completed portable recovery execution (newest checkpoint)

**Portable PostgreSQL/database-and-file recovery PASS. Overall A2 remains NOT
VERIFIED for full managed Supabase services.** The private owner setup completed;
the prior pending-input checkpoint below is historical, not the current blocker.

| Actual execution | Result / evidence |
|---|---|
| Private owner setup | PASS: masked password/custody and writer-freeze attestations; exact new-directory EFS/user-key changes explicitly approved locally. EFS inheritance, synthetic CMS round trips and both AES-256 password-encrypted PFX imports passed. Password was not provided to chat/argv/source files |
| Protection before sensitive exports | PASS: private EFS staging and restrictive ACLs; source dump, downloaded bytes, metadata and recovered plaintext kept there. CMS algorithm checked as AES-256. Existing unencrypted volumes were not reconfigured |
| Consistent database export | PASS: full pg_dump custom archive from the source session pooler with verify-full TLS/read-only mode and exported REPEATABLE READ snapshot. Archive readable, no dump warnings; 49 accessible source table fingerprints recorded. No source data/schema writes |
| Storage bytes | PASS: all 10 objects, exact bucket/key mapping, MIME/size/metadata and SHA-256 preserved; source object/bucket state reconciled after export. Both local and USB recovered bytes match. Writer freeze is owner-attested, not independently dashboard-audited |
| Available configuration | PASS, bounded: encrypted supplement with 30 roles/24 memberships, database-role settings, schema/default ACLs, extension inventory, security-function owner/SECURITY DEFINER/search_path/ACL metadata and available public Auth settings. No role-password/signing-key/control-plane export. Supplement and column rules were captured after the DB snapshot and are explicitly labeled accordingly |
| Independent encrypted copies | PASS: local G and removable USB J. Both copies independently read back, decrypted and hash-validated: 15 main recovered files plus one configuration supplement per copy; 17 ciphertext entries verified. Both PFX copies imported/decrypted in memory during setup. Archive decryption ran on the same PC using its owner certificate; no total-machine-loss/key-store-loss exercise claimed |
| Final integrity pin | **ciphertext-index.json SHA-256: f4a59c655b50fd121f8f725644a0643da51334f8df2c200b7665a36ec25b6f8a**. This supersedes intermediate pre-configuration indexes; it covers the configuration supplement as well as the original encrypted chunks/manifest |
| Isolated restore | PASS: a new loopback-only PG18 cluster/database, no live app connection or source credentials loaded by the restore process. Restored from the independently decoded USB copy. No existing PostgreSQL service/database/configuration changed |
| Restored database semantics | PASS: **41** public/Auth/drizzle table fingerprints, **140** portable constraint definitions, **389** column NOT NULL rules, indexes and trigger definitions match. All 366 PG18 catalog constraints validated; PG18 adds NOT NULL catalog entries absent in PG17. Available Auth data restored, not GoTrue/MFA services |
| RLS / migration preservation | PASS: 13 public RLS flags match, 13 non-owner/non-BYPASSRLS probes denied; 0007 CHECK remains absent. Source owner/ACL preservation was intentionally not claimed: local restore used no-owner/no-privileges and a local-only probe role |
| File protection and shutdown | PASS: synthetic PostgreSQL writes tested before real restore, restored files checked; final audit found **0 unprotected nonempty files** under the staging/rehearsal root and **0 remaining isolated PostgreSQL processes**. Existing PostgreSQL service remains Running. Empty bootstrap files are not represented as sensitive plaintext exports |
| Measured successful rehearsal | pg_restore **0.784 seconds**; complete successful local rehearsal **13.339 seconds**, including bootstrap/protection tests/validation/shutdown. Final main packaging/readback/decryption phase **5.766 seconds**; this excludes source-export time, supplemental-config work, owner interaction and earlier rejected attempts. Not a total disaster RTO |
| Managed service recovery / objectives | NOT VERIFIED: Supabase Auth/GoTrue/MFA encryption-key usability, Storage API/signed URLs, provider configuration and provider-native recovery. PG17 restore, exact owners/ACLs, source-machine-loss recovery, recurring 24h RPO/8h RTO/retention are not demonstrated. No critical A2 gate waived |

### Resolved execution issues and preservation

The first source run completed its protected dump/downloads but rejected comparison
of JS Date objects with saved ISO strings. Normalizing timestamps and rechecking all
49 source fingerprints plus objects/buckets validated the saved export; no dump was
overwritten. An initial pg_ctl child-handle wait timed out after bootstrap only; its
exact temporary cluster was identified and stopped before any source restore.
Subsequent bootstrap/validation attempts caught loopback inet text formatting and
the need to create local auth/drizzle namespaces for a schema-filtered restore.
Finally PG18's extra NOT NULL catalog entries were separated from portable constraints
and all column rules independently compared. Rejected attempts remain protected;
none is labeled successful. All temporary clusters are now stopped.

Post-execution repository validation: typecheck/lint PASS; 773 tests passed with
90 existing opt-in skips; diff checks PASS. No application code changed, so no
new build/browser fixture run was needed; prior build/PDF trace and Drizzle evidence
remains unchanged. These local test passes do not replace managed-service recovery.

Encrypted backup/key directories are on the owner-selected G and J locations; exact
paths and detailed execution reports are retained privately with the non-secret owner
setup receipt and EFS execution report, not committed. The verified-final subdirectories
contain the accepted set; preserve earlier sets and keys pending owner retention
instructions. EFS/CMS user certificates and new private directories were created only
under explicit local approval. No existing volume was encrypted/reformatted, no
production credential/session/connection was revoked, and no Storage cleanup,
migration, deployment, Vercel change or merge was performed.

### Remaining owner actions — current consolidated handoff

1. **One provider/dashboard session:** corroborate the owner-attested writer freeze,
   complete collaborator/integration/secret-scope/old-deployment inventory and explain
   the missing sidecars. Verify existing-project provider-native backup availability
   and **Auth/MFA-key/config recovery coverage plus a supported validation route**.
   That is the remaining critical A2 service-recovery gap, not missing local backups,
   USB, Docker or PG installation. Confirm recovery targets/cadence/window and
   privacy/contact/retention, redirect allowlist, real Turnstile hostname, commercial
   hosting and log privacy. No production changes are implied by this review.
2. **After reviewing recovery evidence:** explicitly authorize named owner executors
   for B–H at release 36594bf (unless separately replaced). Follow B → C → D → E → F
   → G → H in the conversion plan: retire historical access/sessions/connections;
   prove fresh access and old denials; genuine issuer receipt + >2h1m expiry; exact
   eligible original-object cleanup; sole 0007; Production-only fresh env/CA and pinned
   release; owner MFA/uncached hosted SQL-TLS; SSL enforcement only when needed after
   all clients pass; recovery refresh and reviewed cron/backup cadence. No old
   credential resurrection or historical DEV rollback. All privileged mutations
   remain unapproved, including the absent issuer-retirement receipt.
3. **Separate launch gate:** approve protected synthetic apply/review/file/PDF
   acceptance/cleanup, then explicitly authorize real publishing/intake after passing
   results and no residual synthetic data. Do not treat portable recovery as permission
   for either gate.

## Prompt 18 — preceding execution checkpoint (historical)

**A1/A2 not complete.** A private local owner window has actually been launched for
masked password/custody, remote-freeze attestation and explicit new-directory EFS /
user-certificate / encrypted key-export approval. No general A2 reapproval is sought.
At this checkpoint that interaction is pending; do not claim its conditional steps,
backup, encryption or restore have executed. Private helpers are outside Git.

| Check actually executed | Outcome / evidence |
|---|---|
| Fresh source identity + certificate-verified SQL | PASS: source/API/both DB tenant checks; session-pooler read-only transaction, trusted CA, PostgreSQL 17.11 |
| Capacity estimate | DB size 13,514,419 bytes; Storage metadata total 227,976 bytes. Previously verified free space J 57.76 GiB/G 145.94 GiB comfortably exceeds these estimates and a 1 GiB USB/2 GiB local floor; actual archive size remains unknown |
| Application/Auth snapshot | 0 jobs/applications; 1 allowlist; 7 sessions, all AAL2. No session/factor/password changes |
| RLS/security triggers | PASS: all 13 public tables RLS enabled, no public/Storage policies, both careers Auth security triggers present. Read-only counts/fingerprints accessible for 49 public/Auth/drizzle/Storage tables; not a restore test |
| Migration preflight | PASS: all six historical hashes/timestamps match journaled files; 0007/CHECK absent, 0 incompatible salary rows. No applied migration/ledger change; original 0006 remains untouched |
| Current scoped Storage reconciliation | PASS: 10 objects/6 sidecars/4 uploads; all unchanged original metadata/timestamps and downloaded SHA-256/lengths match. 0 unknown/changed objects. Four structural fingerprints match. Ten original sidecars absent; actor/timing still unknown |
| Original backup integrity | PASS: source-pinned manifest digest and all 20 original artifact hashes/lengths. Scoped historical backup, not encrypted full recovery |
| Cleanup prerequisite receipts | Job-removal receipt exists, matches the original manifest and has expired. Issuer-retirement receipt is absent. No official cleanup dry-run/apply or fabricated cutoff; object age/job-removal alone is insufficient |
| Auth settings read | PASS: public settings report signups disabled. Redirect allowlist, provider recovery and MFA service portability are not exposed by this endpoint |
| Management access | No MCP resources/templates available. No authorized provider dashboard/control-plane channel is available to the agent; remote freeze, collaborators, scope overrides, old deployments, integration access and disappearance history remain owner evidence |
| Privacy/hosting/widget readiness | Source still says Draft/owner review; local public contact is unset. Retention/contact approval, Vercel commercial-use plan/log redaction, actual Turnstile hostname configuration and protected acceptance are NOT VERIFIED; no values invented or activated |
| Private helper validation | PowerShell parser: 0 errors for owner/packaging workflows; Node syntax checks pass. Source audit helper actually executed. Packaging/restore runtime paths are not thereby tested |
| Repository checks | Typecheck/lint PASS; 773 tests passed, 90 existing opt-in skips; Drizzle check PASS. No app source changed: prior build/PDF trace evidence retained, not needlessly rerun. No destructive/browser/cloud fixtures |
| Full backup, two-copy decryption, protected PGDATA and restore time | NOT VERIFIED / NOT RUN while private owner prerequisites are pending. No ciphertext integrity digest or measured recovery time yet; no claimed RPO/RTO or full managed-service recovery |

### One consolidated remaining owner handoff, grouped by session

1. **Local private window:** complete masked password/custody and the exact optional
   EFS/user-key setup approval, or decline it. Source exports stay blocked until
   protection/key recovery/synthetic encryption pass. Once verified, run delegated
   A2 export → encrypted local/J copies → readback/decryption → isolated PG18 restore
   with private logs and measured validation. No new hardware/software/project and
   no renewed A2 approval. Preserve original backups and existing PostgreSQL service.
2. **One owner dashboard session:** attest/finalize remote deployment/DEV-job/cron/
   issuer freeze and access/scope/collaborator/integration inventory; explain missing
   sidecars. Verify **existing-project** native backup/Auth-MFA-key/config recovery
   coverage and a supported non-destructive validation route. Confirm recovery
   objectives/window and privacy/contact/retention, Auth redirect rules, actual
   Turnstile hostname, commercial hosting and log privacy. No rotation/release now;
   unsupported critical recovery keeps A2 blocked, even after a portable PG18 pass.
3. **After reviewing A2, one scope-bound B–H execution session:** explicitly authorize
   named owner executors and immutable release 36594bf (or separately reviewed
   replacement). Follow conversion-plan categories B → C → D → E → F → G → H:
   retire historic DB/API/legacy service_role/upload/cron/Turnstile access, password/
   sessions/connections and DEV/Preview/CI copies; prove old denials + fresh access;
   record actual issuer cutoff, wait >2h1m; exact unchanged original subset cleanup;
   sole pending 0007; Production-only fresh env/multiline CA and pinned release;
   owner MFA/uncached hosted SQL-TLS and denial checks; enforcement only if needed
   after all clients pass TLS; recovery refresh and reviewed cron/monitoring/backup
   cadence. Source preflights must be fresh at mutation time. Keep intake closed.
4. **Separate launch decision:** authorize protected synthetic apply/review/file/PDF
   acceptance and exact cleanup, then explicitly approve real publishing/intake only
   after passing results and no residual test data.

Failure/continuation rules remain unchanged: no old credential resurrection, no
historical DEV deployment promotion/rollback, no guard/TLS/MFA/RLS relaxation, no
blind migration retry or broad Storage delete. On uncertainty preserve evidence,
keep intake closed and inspect the exact affected state before a separately
authorized correction. Documentation HEAD never replaces the approved release pin.

## A1/A2 earlier authorized checkpoint — historical, not completion

### Subsequent Docker-free preparation (supersedes tooling/target assumptions below)

Later minimum-setup clarification: A2 sensitive execution is approved, not waiting
for renewed approval. See the runbook's minimum-setup path. 7-Zip 21.03 beta was
found outside PATH with AES-256 codec support, but no encryption round trip ran.
No USB/new hosted project/Docker/PG17 installation is required. Existing independent
storage is eligible with explicit failure-domain evidence; H backing remains unknown.
Remaining execution blockers are owner-controlled recoverable key/interactive entry,
protected restore storage and a selected independently backed second destination,
plus source/configuration completeness and managed-service recovery evidence. Source
exports, two-copy integrity/decryption, local restore and timing remain NOT RUN.

Owner approved documentation/preparation with existing PostgreSQL 18 and feature-
branch publication, not sensitive exports, live changes, cluster startup/restore,
PostgreSQL 17/Docker installation or new hosted infrastructure. Inspection found
all six client/server tools at 18.4, a registered installation and a running
postgresql-x64-18 service. No 17 installation was found in PATH, conventional
locations or registry; no existing cluster was connected to or modified.

[LOCAL_RECOVERY_RUNBOOK.md](LOCAL_RECOVERY_RUNBOOK.md) now specifies verified-TLS
read-only exports, Auth/trigger/config coverage, separate hashed Storage bytes,
encrypted staging/CMS packaging, two independent decrypt-and-verify copies and a
separate loopback-only PG18 cluster. It includes portability exclusions and local
privilege tests, not fabricated Supabase services. No new recovery target/tool
installation is required for the portable database/file portion; owner custody and
separate execution approval are still required. PG17 → PG18 is a forward-version
rehearsal, not proof of a restore back to PG17.

**PASS:** bounded tooling inspection and preparation. **NOT VERIFIED / NOT RUN:**
exports, encryption round trip, independent copies, local restore, elapsed recovery,
RPO/RTO and managed Auth/MFA/Storage recovery. Existing-project provider recovery
coverage and a supported validation route are the smallest additional mechanism;
availability alone does not satisfy full-service restore proof. No critical A2
requirement has been waived. Earlier statements about no full restore target/tool
workflow remain execution gaps, not a need for Docker or another hosted project.

The later owner explicitly authorized pushing documentation to the existing feature
branch; this supersedes the earlier local-only publication hold, not the deployment
freeze requirement or release SHA pin. A push/CI run is not deployment approval.

Docker-free documentation verification: typecheck and lint PASS; default tests
**773 passed, 90 existing opt-in skips** (107 files passed / 8 skipped). Markdown
fence/local-file-link and new-runbook credential/path checks PASS. Existing DECISIONS
encoding was preserved rather than normalizing unrelated historical content. No
build/browser/live tests or sensitive backup/restore/encryption round trip ran; no
user-visible/code changes require browser acceptance in this documentation change.

Only non-sensitive/read-only agent work was supported. No stop/revoke/delete/export/
restore/provider setting change was performed; no new sensitive backup was created.
Existing worktrees/user changes and the prior backup remain untouched. Findings
below are a point-in-time snapshot, not a guarantee against future writes.

| Check | Result | Evidence / limitation |
|---|---|---|
| Approved project and release pin | PASS | Read-only probes independently checked API + both DB tenants against the source production ref. Approved candidate remains 36594bf; no deployment/merge |
| Local project worker snapshot | PASS | Process inspection found 0 known project Next.js processes, 0 fixture/test workers and 0 other node.exe processes; no process needed stopping. No raw process command lines logged |
| Worktree credential-copy inventory | PASS (bounded) | Root private env copies remain in primary and demo-validation worktrees, both labeled development and referencing this project; names/presence only recorded. Other three worktrees have no root private env. Inherited/external stores still need owner review; nothing deleted/edited |
| Complete remote access inventory/freeze | NOT VERIFIED | No MCP management resources, Supabase/Vercel/GitHub management tokens in the current process, or supabase/vercel/gh executable on PATH. No dashboard freeze or scope/collaborator/job/deployment audit could be performed. App/API keys are not management credentials and were not used as such |
| Database access metadata | PASS (snapshot only) | 9 login roles: 1 superuser login, 4 bypass-RLS logins; names fall within the known system/provider-name classification. This is not proof of account ownership or exclusive access. 5 other client backends, 0 active at sample; pooler/service backends are not necessarily five external operators. No connections terminated |
| Source data/security preservation | PASS | Verified-TLS read-only inventory: 0 jobs/questions/applications/attachments; 6 departments, 8 brands, 13 options, 1 allowlist/Auth user, 1 admin with verified TOTP; 7 sessions, all AAL2. All 13 public tables have RLS; 0 public/Storage policies. No user IDs/emails/factors/tokens printed or changed |
| Current artifact subset and structure | PASS (integrity only) | **10** current pending objects: **6 sidecars + 4 uploads**. All ten IDs/paths/metadata/timestamps and downloaded byte hashes match the original approved manifest; 0 unknown/changed objects. All four structural row fingerprints match original. No object created/deleted |
| Cause of ten absent sidecars | NOT VERIFIED | Compared with original 20 objects, ten original sidecars are absent. No actor/timing attribution is available; cron or owner action must not be assumed. Owner must review activity/cron history and freeze remaining issuers before any fresh recovery baseline/cleanup |
| Existing original scoped backup | PASS (integrity only) | Original pinned manifest digest and all 20 original artifact sizes/SHA-256 match. It covers only the earlier DEMO graph/files; directly parseable manifest/raw artifact files are not an independently encrypted full-project archive. Filesystem encryption is not established |
| Backup client tooling | PASS (availability only) | pg_dump/pg_restore/psql 18.4 are on PATH; source server is PostgreSQL **17.11**. Tool presence is not a successful export or verified round-trip/version compatibility |
| Archive encryption/key custody | NOT VERIFIED | age/gpg/7z/openssl not on PATH. Windows PowerShell 5 has Protect-CmsMessage/Unprotect-CmsMessage/New-SelfSignedCertificate, but no owner-selected encryption recipient/recoverable private key/tool workflow. No key created; the Supabase TLS CA is **not** an owner backup encryption key |
| Two independent encrypted copies | NOT VERIFIED | No approved storage locations, ciphertexts, independent custody or decryptability evidence supplied. Two folders on one disk would not prove independence |
| Isolated full restore target | NOT VERIFIED | No recovery target supplied and docker not on PATH. A bare PostgreSQL restore cannot establish managed Auth/config/MFA/Storage recovery. No local/cloud target was created, and no production endpoint was used as a restore target |
| Full backup / restored constraints, RLS, files and Auth | NOT VERIFIED | No complete encrypted DB/Auth/config/Storage recovery set or genuinely isolated rehearsal was performed. Prior source RLS checks and scoped file hashes are not restore evidence |
| Recovery objectives/window | NOT VERIFIED | 24h RPO / 8h RTO / 14d retention / two encrypted copies / pre-change 14d / preferred 22:00–04:00 Asia/Dhaka are proposed only. No date, measured recovery time, confirmed policy or achieved schedule |
| Overall A1 freeze / A2 recovery | NOT VERIFIED | Local/read-only portions complete; provider freeze, backup custody and full recovery require owner actions below. No actual export/restore was attempted, so no failed recovery run is claimed |

Documentation-only checkpoint validation: typecheck/lint passed; credential-free
default unit suite passed **773 / 90 existing opt-in skips** (107 files passed,
8 skipped). Diff checks passed. No ordinary browser/live fixture suite, build,
authorized cron or synthetic application was run. These local checks do not prove
freeze, encryption, recovery completeness or RPO/RTO. Keep this checkpoint local
until the owner confirms auto-deploy/CI freeze; pushing could trigger integrations.

### Consolidated owner actions — one checklist, no credentials in chat

**Historical A1/A2 checklist below is superseded by the single current minimum
owner list in [LOCAL_RECOVERY_RUNBOOK.md, section 8](LOCAL_RECOVERY_RUNBOOK.md#8-consolidated-minimum-owner-actions-to-finish-conversion).**
Use the Docker-free PG18 path there; do not provision another hosted/full local
Supabase target merely to follow this older list. Full-service proof remains gated.

1. **Owner dashboards/private terminal:** pause Git auto-deploy, both DEV workflows,
   production cron and other known writers; protect old write-capable deployments;
   review all env scopes/branch/integration overrides, collaborators and key custodians.
   Preserve admin/provider recovery access. Return a redacted freeze/access summary
   and activity explanation for the ten missing sidecars; do not revoke credentials,
   sessions, keys or connections or trigger fixture cleanup during A1.
2. **Owner custody decisions:** confirm/replace the still-proposed recovery targets
   and choose a date, two independently stored encrypted backup destinations,
   encryption method with independently recoverable owner key, and a genuinely
   isolated compatible full Supabase recovery target. Arrange missing tooling
   privately if needed; no hosted project creation or repository dependencies were
   authorized/installed. Do not use the downloaded TLS CA as a backup recipient key.
3. **Owner private operator:** after the freeze is evidenced, create the encrypted
   complete DB/ledger/roles-and-config recovery coverage, managed Auth/security-trigger
   and Storage-file-byte backup. Coordinate DB/file consistency, use verified TLS,
   preserve original backups, and avoid plaintext exports/logs. Obtain two verified
   encrypted copies and test owner decryption independently of the source machine.
   Use a reviewed binary-safe workflow: do not pipe a binary custom-format pg_dump
   through PowerShell 5 text/CMS pipelines. Verify decrypted archive hashes and
   restore compatibility before trusting copies; any staging and restored storage
   must remain owner-controlled and encrypted.
4. **Owner isolated rehearsal + redacted proof:** restore only into the approved
   isolated target, with no production write route/active automation. Verify table/
   object counts, constraints/triggers, RLS/anon denial, exact file paths/MIME/hashes,
   Auth/config/MFA recovery under the existing no-factor-change restriction and actual
   elapsed recovery time. Stop/escalate if managed Auth portability/required key
   material cannot be recovered safely. Do not apply pending 0007 to satisfy this
   pre-conversion rehearsal or weaken target guards. Share only tool versions,
   encrypted-copy integrity/decryption results, component coverage, isolation checks,
   measured timing and PASS/FAIL outcomes—not backup bodies, identities or keys.

No further A1/A2 approval is needed for the already authorized scope. Genuine
blockers are management access, operator custody/recovery decisions and available
isolated infrastructure—not permission to rotate/delete/deploy early. Once A1/A2
are actually proven, the next required authorization is explicit execution of the
selected B–H categories. Until then no retirement, cleanup, migration, enforcement,
deployment, cron activation, merge or applicant submission is permitted.
