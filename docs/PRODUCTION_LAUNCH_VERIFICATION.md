# Production conversion verification — Stage 0

**Not production-ready. No Gate 1 live changes approved or executed.**
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
Approve/withhold categories, name executors and reviewed release SHA, and choose the
recovery target/RPO/RTO/retention and maintenance window. Owner retains credentials.
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
