# Careers Portal launch runbook (Windows owner)

The agent prepares code and dev checks; **you perform production setup**. Never send production credentials, backups or applicant records to the agent, chat or git. V1 is a small recruitment portal: no candidate accounts, automatic email or HR management.

## 1. Choose the region and hosting plans
The dev Supabase project is Mumbai. Compare Mumbai and Singapore using equivalent small database round-trips from Vercel functions and typical Bangladesh user connections; record median/tail latency, not just ping or a single request. If necessary, create disposable benchmark projects yourself. No production region has been selected by the agent.

- Supabase Mumbai (`ap-south-1`) -> Vercel `bom1`.
- Supabase Singapore (`ap-southeast-1`) -> Vercel `sin1`.
- `vercel.json` currently uses **bom1** for the Mumbai dev-backed preview. If Singapore wins, change its regions entry to sin1 before production deployment. Functions and database must match.
- Supabase free projects can pause after inactivity and have no automatic database backups. Daily keep-alive is best effort, not a guarantee. Restore a paused project in the dashboard.
- Vercel Hobby is intended for non-commercial use. Choose an appropriate paid plan before a commercial careers launch. For business-critical use, prioritize reliable database backups/availability and sufficient hosting limits.

## 2. Create and configure production Supabase
Create a separate project in the chosen region. Save its project reference and credentials privately. In Authentication > Sign In / Providers, switch **Enable sign-ups OFF**. Create no public signup flow. Keep the existing dev project separate.

Use the transaction-pooler URL for DATABASE_URL (`prepare: false` is configured). For DIRECT_URL use direct Postgres, or the **session pooler** if the Windows network cannot reach IPv6. Copy the appropriate project-specific usernames/ports from Connect; percent-encode special password characters in connection URLs. Do not substitute a dev connection.

Create a private file outside the repo, for example `C:\secure\careers-production.env`. Fill all runtime variables below. Also set:
- `ALLOWED_SUPABASE_PROJECT_REF` = production project reference, independently copied from its dashboard.
- `DEV_SUPABASE_PROJECT_REF` = existing dev reference (identifier only, not its credentials).
- `ADMIN_EMAIL` = your existing production Auth account's address, when doing admin setup.

Owner commands require explicit APP_ENV, both pins, the API host and **both DB URLs** to match. Production cannot target the dev pin; development must target it. The ordinary `admin:add` and `storage:ensure` remain dev-only. Demo/reset scripts always remain dev-only. Never run demo/reset on production.

## 3. Environment inventory
| Variable | Handling / purpose |
|---|---|
| APP_ENV | Explicit `production`; dev/preview uses `development` |
| DATABASE_URL, DIRECT_URL | **Secrets**, server-only DB credentials |
| SUPABASE_SERVICE_ROLE_KEY | **Secret**, server-only Auth/Storage administration |
| UPLOAD_SESSION_SECRET | **Secret**, independent random >=32-character value |
| CRON_SECRET | **Secret**, independent random >=32-character value; Vercel adds the bearer header |
| TURNSTILE_SECRET_KEY | **Secret**, real production widget secret |
| NEXT_PUBLIC_SUPABASE_URL | Public API URL for the correct project |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public anon/publishable browser key; RLS denies app-table access |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | Public real production widget key |
| NEXT_PUBLIC_SITE_URL | Optional public origin override; set the approved canonical custom origin for launch, omit on previews for Vercel system-hostname fallback |
| NEXT_PUBLIC_CONTACT_EMAIL | Optional public recruitment/deletion contact; confirm before launch |
| DEV_SUPABASE_PROJECT_REF | Dev identifier for guards; no dev secret in production |
| ALLOWED_SUPABASE_PROJECT_REF, ADMIN_EMAIL | Owner-maintenance file only; not needed by deployed request handlers |

Use a password manager to create independent secrets, then save them privately; do not print them with environment listing commands. Turnstile test site keys/secrets are allowed only with explicit APP_ENV=development. Production build/start rejects missing/unknown APP_ENV and test-key values. NEXT_PUBLIC variables are baked into browser bundles: change them before building and redeploy after edits.

## 4. Run manual production setup
Install Node 24/pnpm 12.9.1 and run `pnpm install --frozen-lockfile` from G:\career. Use a fresh PowerShell session with no leftover dev variables: existing environment values take precedence over an env file. Node 24 `--run` passes the private file settings to the package script; the inner `.env.local` cannot replace already-set values.

Run one command at a time, stopping on any failure:
```powershell
node --env-file="C:\secure\careers-production.env" --run=db:migrate:owner
node --env-file="C:\secure\careers-production.env" --run=storage:ensure:owner
node --env-file="C:\secure\careers-production.env" --run=seed:base:owner
node --env-file="C:\secure\careers-production.env" --run=jobs:seed-shells
```
These map to the same migration/base code with an independent owner target gate. Never edit applied migrations. Drizzle keeps its migration ledger in the database; do not use Supabase CLI `db push` against this repo's Drizzle migrations.

Buckets: applications PRIVATE, <=10 MB and the supported file MIME union plus server-written JSON reservations; brand-assets PUBLIC, <=1 MB SVG/PNG/WebP. The bootstrap refuses visibility mismatches rather than making applicant files public. Per-slot CV/type/signature limits remain enforced by application code.

Base seeding creates only missing departments/brands, preserving owner edits. Shell seeding creates the **exact 19 final titles/slugs/departments as blank drafts**, preserves every existing slug, and creates no brands/questions/applicants/files. Full-time/onsite and CV-required are initial schema-required editable placeholders, not approved role decisions. In admin, set brands (one primary), real employment/work mode, content, questions, CV setting and deadlines before publishing.

Order: **base -> draft shells -> fill content in admin -> publish**. Once published, slugs cannot change. Do not print poster links until the real roles are reviewed/published.

## 5. Create the first admin and enroll MFA
In the production Auth dashboard create your user manually with a strong password and auto-confirmation. Set ADMIN_EMAIL privately in the owner file, then:
```powershell
node --env-file="C:\secure\careers-production.env" --run=admin:add:owner
```
The command only allowlists an existing Auth identity and prints no address. It never creates a user or enables sign-ups. After deployment sign in at `/admin/login`, re-enter the password to start authenticator enrollment, scan the QR image or enter the key, and verify TOTP. MFA is mandatory; a password-only session cannot read applicants or download files/PDFs. Keep the authenticator secure. Lost-factor recovery is manual in Supabase: revoke sessions/remove the lost factor, then enroll again; there is no portal bypass or verified-factor removal endpoint.

## 6. Preview first, then production Vercel
Import the repository as a Next.js project; use Node 24, pnpm install with the frozen lockfile, `pnpm build`, and the standard Next output. Review `VERCEL_CHECKLIST.md` before deploying.
V1 code is on **v1-complete**; main still contains only the foundation. Deploy that branch as a dev-backed preview first. After owner review, either merge through your own release process or consciously select the reviewed branch as Vercel's Production Branch. Do not assume the repository's current default branch already contains V1. The agent does not merge or update main.

For a preview use **dev-only** project credentials, APP_ENV=development, the dev pin and documented Turnstile dev test keys. NEXT_PUBLIC_SITE_URL can be omitted: automatically exposed Vercel hostnames provide the build-time fallback (project production hostname first, deployment hostname next). Region is bom1. Previews must never connect to production. This development/test-key configuration must never be used for the real production recruitment deployment. Hosting access logs must not retain applicant-name/email filter queries or authorization headers; application request logging is disabled, but provider settings still require review. See VERCEL_ENV_TABLE for all settings.

For production add the production runtime variables to the Production environment only. Create a real Cloudflare Turnstile widget for careers.fixenmedia.com and supply its real pair of keys. Do not allow localhost on the production widget. Redeploy after setting public variables. Disable sign-ups on production independently of the dev setting.

## 7. Connect the domain using DNS only
In Vercel add `careers.fixenmedia.com`. In the **existing authoritative DNS zone**, add the `careers` CNAME using the exact target Vercel displays (it may be project-specific). Leave TTL at the provider default. Remove a conflicting record for that same host if necessary; do not alter unrelated brand-site records.

**Do not change nameservers. Do not use cPanel's Subdomains tool.** This is a separate Vercel app, not a cPanel document root. If DNS is proxied, use DNS-only during Vercel validation. Check from PowerShell:
```powershell
Resolve-DnsName careers.fixenmedia.com -Type CNAME
```
Wait for DNS propagation and Vercel's domain/certificate verification. Confirm HTTPS loads without a certificate warning and the app's public URL matches the final domain.

## 8. Post-deploy smoke check (owner)
- Home shows actual open counts, brand links/URL filters, keyboard focus and reduced-motion behavior. Check desktop and a real phone.
- Draft is 404; closed/expired role has no form. Open role's Apply scrolls to its form; old apply URL returns 308 to the anchor.
- Complete a clearly synthetic application with Bengali answers and a small PDF CV using real Turnstile; retain its reference. Confirm review/status/note/CV/PDF downloads with MFA, then delete the synthetic record and files.
- Anonymous and authenticated non-admin accounts cannot access admin pages/actions/downloads. Password-only admin goes to MFA. No applicant records are exposed by the success reference.
- Verify sign-ups OFF, private applications bucket, RLS on every application table with no public policies, short-lived private links and correct MIME/size limits.
- Check PDF fonts/logo rasterization and serverless duration first. Check canonical/Open Graph/sitemap/robots; approve privacy text, retention and contact address before inviting real applicants.
- Vercel Cron Jobs shows exactly one `/api/cron/daily` schedule. Missing/wrong bearer gets 401; authorized run returns counts, not paths or records. Hobby timing is within the scheduled hour, missed deliveries are possible and failures are not automatically retried. Monitor failures and retry privately; never paste CRON_SECRET into a URL.

## 9. Manual backup routine
Keep backups outside the repo on encrypted owner-controlled storage, with a second encrypted offline copy. Back up daily while recruiting actively, at least weekly otherwise, and before migrations/deployments. Record dates and counts, not applicant details in shared notes. Choose backup retention consistent with the approved privacy policy.

Install native PostgreSQL client tools for Windows from the official installer; pg_dump must be at least the server's major version. Configure a protected `C:\secure\pg_service.conf` with a `careers-prod` entry containing the production **direct/session-pooler** host, port, database, username/password and sslmode=require. This avoids putting passwords into command arguments. Do not use the transaction pooler for exports.

Create the dated backup folder privately (example below assumes it exists), then:
```powershell
$env:PGSERVICEFILE = 'C:\secure\pg_service.conf'
$backup = 'C:\careers-backups\YYYY-MM-DD'
pg_dump --dbname="service=careers-prod" --format=custom --schema=public --schema=drizzle --file="$backup\database.dump"
if ($LASTEXITCODE -ne 0) { throw 'Database backup failed.' }
```
This application-schema archive contains applicant data, notes, allowlist rows, RLS/triggers and the Drizzle ledger. It does **not** constitute a complete managed Supabase project/Auth backup or include file bytes. Keep configuration/recovery information privately and verify restores rather than assuming a file proves recoverability.

For Storage, install the supported Supabase CLI separately (not as an app dependency), use an isolated owner backup folder, run `supabase init`, `supabase login` privately and `supabase link --project-ref <production-ref>`. Confirm its displayed linked project. The documented Storage commands are experimental; check `supabase storage cp --help` for your installed version. Download both buckets, preserving paths, and suppress object-name output:
```powershell
supabase storage cp "ss:///applications" "$backup\files\applications" --recursive --linked --experimental *> $null
if ($LASTEXITCODE -ne 0) { throw 'Private Storage backup failed.' }
supabase storage cp "ss:///brand-assets" "$backup\files\brand-assets" --recursive --linked --experimental *> $null
if ($LASTEXITCODE -ne 0) { throw 'Brand Storage backup failed.' }
```
Check counts and privately open representative files. Keep relative paths and MIME types; database storage_path values must still point to the same objects. Never put backups/CLI credentials into this repository or a public bucket.

### Restore rehearsal and rollback
Rehearse restores yourself on a new isolated recovery project, never overwrite live production to test. Use a separate `careers-restore` service entry and a reviewed PostgreSQL archive restore (`pg_restore --dbname="service=careers-restore" --no-owner --single-transaction --exit-on-error <archive>`); resolve managed public-schema/default-privilege differences with an experienced operator before running destructive options. Recreate bucket visibility/limits, upload objects to their exact original relative paths with preserved MIME types, and verify rows, counts, private downloads, RLS and MFA. Test one object path before any recursive upload to avoid an extra directory level. Auth accounts/MFA may need recreation and allowlisting because this app-only archive excludes managed Auth identity state. No restore rehearsal has been performed by the agent.

For a code regression, use Vercel's previous known-good deployment/rollback, keeping compatible environment settings. Rollback also restores that deployment's cron definition. An application rollback does **not** undo migrations or lost data: use forward corrective migrations and a separately rehearsed recovery plan. Never edit applied migrations or reset production.

## References and limitations
Official references (reviewed 2026-10-08): [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html), [pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html), [Supabase Storage CLI](https://supabase.com/docs/reference/cli/supabase-storage-cp), and [Vercel cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs). Storage CLI flags are version-dependent and experimental; backup/restore, DNS, hosted packaging, production settings and physical-phone checks remain owner verification.

V1 has bounded file-signature checks, not antivirus/full document parsing; no automated applicant retention, email notifications, ranking or extra roles. Accepted security residuals and provider failure/retry behavior are in DECISIONS/ARCHITECTURE. Keep privacy/contact/brand details and actual job content current through the admin panel.
