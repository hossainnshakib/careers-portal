# Environment inventory for Vercel deployment

Names and value-source guidance only: no keys, tokens, connection strings, addresses or project-reference values are recorded here. The inventory covers explicitly read app/maintenance/test settings, including schema-based reads. Generic process-environment forwarding is not an instruction to configure every OS variable.

**APP_ENV=development with Cloudflare's test keys is only for the dev-backed test deployment and must never be used for the real production recruitment deployment. Production requires APP_ENV=production and real Turnstile keys.** Node's production build mode does not make a development APP_ENV safe for a real production launch. Strict APP_ENV/test-key startup checks remain enforced.

Prompt 17 supersedes old shared-DEV guidance: the designated project is forbidden
in DEV/previews/cloud fixtures regardless of environment repinning. There is no
alternate approved cloud DEV target. Use credential-free builds/checks until one
exists. Production APP_ENV must agree with VERCEL_ENV=production when on Vercel.
Follow `PRODUCTION_CONVERSION_PLAN.md`; no live conversion is approved by this table.

## App and platform settings
| Name | Public or secret | Build/runtime need | Where the owner gets it | Dev-backed preview guidance | Production guidance |
|---|---|---|---|---|---|
| APP_ENV | Server mode, not a secret | Build and runtime, mandatory | Owner selects the environment explicitly | Explicit development/test mode, dev DB only | Explicit production mode; no fallback |
| DATABASE_URL | Secret, server-only | Runtime; validated at production startup | Supabase Connect, transaction pooler | No credentials for designated production target | Fresh production-only runtime credential; certificate verification enforced |
| DIRECT_URL | Secret, server-only | Runtime validation and owner migrations | Supabase Connect, direct or session pooler | No credentials for designated production target | Fresh owner/runtime validation URL; never transaction pooler for migrations |
| DATABASE_SSL_CA | Server-only PEM CA certificate, not a password | Runtime/owner clients | Owner downloads correct root certificate from Database Settings SSL | Use only with actual isolated DEV target | Multiline PEM when system trust is insufficient; never disable verification |
| SUPABASE_SERVICE_ROLE_KEY | Secret, server-only | Production startup/runtime; Auth/Storage use | Supabase API settings | Never the designated production key; not needed for credential-free build | Fresh production-only secret key; revoke historical/legacy access |
| UPLOAD_SESSION_SECRET | Secret, server-only | Production startup/runtime HMAC | Password manager / cryptographic secret generator | No secret needed for credential-free build | Independent fresh strong secret; minimum length enforced |
| CRON_SECRET | Secret, server-only | Production startup/runtime cron auth | Password manager / cryptographic secret generator | No secret needed for credential-free build | Independent fresh strong secret; Vercel supplies its bearer header |
| TURNSTILE_SECRET_KEY | Secret, server-only (published dummy keys are public test fixtures) | Build startup validation and runtime verification | Cloudflare widget settings / official test-key docs | Documented dummy key only in explicit dev-backed test mode | Real widget secret; never a dummy key |
| NEXT_PUBLIC_SUPABASE_URL | Public | Build-inlined and server use | Supabase API settings | Dev API endpoint | Production API endpoint |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public anon/publishable key | Build-inlined and server use | Supabase API settings | Dev browser key; app-table RLS denies reads | Production browser key; verify production RLS separately |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | Public | Build-inlined; startup checks | Cloudflare widget settings / official test-key docs | Documented dummy site key in explicit development | Real widget site key for the approved production hostname |
| NEXT_PUBLIC_SITE_URL | Public, optional outside production | Build-inlined, metadata/server use | Approved deployment/custom domain | May be omitted for platform fallback | Explicit approved canonical HTTPS origin required at production startup |
| NEXT_PUBLIC_CONTACT_EMAIL | Public, optional | Build-inlined and server metadata/contact use | Owner-confirmed contact/deletion address | Optional public test/contact address; otherwise placeholder | Confirm the real public recruitment/deletion contact before launch |
| VERCEL | Public platform flag | Build/runtime fallback detection | Automatically exposed Vercel System Environment Variables | Automatic platform flag; do not invent it locally | Automatic platform flag |
| VERCEL_PROJECT_PRODUCTION_URL | Public platform hostname | Build/runtime URL fallback (preferred) | Vercel automatically supplies it | Used before deployment hostname if explicit site override is absent | Automatic project production hostname; custom override recommended |
| VERCEL_URL | Public deployment hostname | Build/runtime fallback | Vercel automatically supplies it | Fallback when project production hostname is unavailable | Fallback only; do not use a hostname as a secret |
| NODE_ENV | Framework-managed mode | Build/runtime | Next/Node tooling | Production compilation/runtime for deployed preview, independent of APP_ENV | Framework production mode; do not manually override it |
| DEV_SUPABASE_PROJECT_REF | Server identifier, not a credential | Mandatory for actual cloud DEV | Independently copied non-production dashboard reference | Must never equal designated production; no alternate target configured | Must be absent; no fabricated reference |

Sitemap is now dynamic, so credential-free development-mode packaging needs dummy public settings but no database/Auth secrets and performs no production DB reads. Actual production startup validates APP_ENV, scope, canonical origin and target identities; runtime validates server settings before I/O. Public variables are compiled into bundles: change before rebuilding. No private key may have a NEXT_PUBLIC prefix. Enable platform-variable exposure when relying on non-production URL fallback.

## Owner maintenance (not normal deployed request settings)
| Name | Public or secret | Need | Value source | Dev usage | Production usage |
|---|---|---|---|---|---|
| ALLOWED_SUPABASE_PROJECT_REF | Private operator identifier, not a credential | Owner CLI only | Independently copied target dashboard reference | Explicitly approved isolated DEV only | Must equal source-pinned production; API/both DB URLs match; writes need exact apply/confirmation |
| ADMIN_EMAIL | Private operator contact / PII | Owner admin CLI runtime only | Existing manually created target Auth user | Existing dev admin for operator tests | Existing production user; keep in private external file, never in source/logs |
| DEV_PROTECTED_ADMIN_EMAIL | Private operator contact / PII | Dev orphan cleanup CLI only | Owner's protected allowlist address | Required only for the explicit orphan-cleanup mode | Do not run the dev cleanup script against production |

Use the private external file procedure in RUNBOOK for owner operations. These are not browser settings and do not need to be supplied to deployed handlers. Demo/reset and default dev admin/bootstrap guards remain dev-only.

## Test/verification tooling (leave unset on a normal deployment)
| Name | Classification / timing | Source and dev guidance | Production guidance |
|---|---|---|---|
| RUN_SUPABASE_TESTS | Nonsecret opt-in test flag, test runtime | Owner/dev CI enables guarded live tests; isolate sweep/seed cases | Never execute these dev test suites against production |
| PLAYWRIGHT_PRODUCTION | Nonsecret browser-test mode, test runtime | Selects the managed optimized local test server | Not an application environment selector |
| RUN_LIGHTHOUSE | Nonsecret explicit performance-test flag | Enables local simulated-mobile measurement | No normal deployed setting |
| CI | Nonsecret test-runner flag | Set by CI; controls retries/reporting/forbidOnly | Not required for request handlers |
| npm_execpath | Nonsecret package-manager path, performance-test runtime | pnpm supplies it to the Lighthouse subprocess launcher | Do not configure manually in Vercel app settings |
| PATH, SystemRoot, TEMP, TMP | OS/tool paths, local PDF helper runtime | Operating system values forwarded to credentials-free child tools | Platform manages them; never publish machine-path diagnostics |

GitHub workflow-only DEV credential aliases are mapped to the app names above: DEV_DATABASE_URL, DEV_DIRECT_URL, DEV_SUPABASE_URL, DEV_SUPABASE_ANON_KEY, DEV_SUPABASE_SERVICE_ROLE_KEY, DEV_UPLOAD_SESSION_SECRET and DEV_CRON_SECRET. DEV_TESTS_ENABLED and DEV_KEEPALIVE_ENABLED are repository enable variables, not app request inputs. Get dev alias credentials only from the dev project/password manager; never place production credentials in those workflows. Lighthouse sets CHROME_PATH and temporary paths for its own child process; these are not application configuration.
DEV_DATABASE_SSL_CA optionally supplies only an isolated DEV target's CA. It does
not override the source-pinned production refusal. Vercel's validation DIRECT_URL
should use its runtime login in session mode, not the privileged migration login;
privileged maintenance credentials belong only in the protected owner file.
