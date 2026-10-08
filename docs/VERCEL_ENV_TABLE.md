# Environment inventory for Vercel deployment

Names and value-source guidance only: no keys, tokens, connection strings, addresses or project-reference values are recorded here. The inventory covers explicitly read app/maintenance/test settings, including schema-based reads. Generic process-environment forwarding is not an instruction to configure every OS variable.

**APP_ENV=development with Cloudflare's test keys is only for the dev-backed test deployment and must never be used for the real production recruitment deployment. Production requires APP_ENV=production and real Turnstile keys.** Node's production build mode does not make a development APP_ENV safe for a real production launch. Strict APP_ENV/test-key startup checks remain enforced.

## App and platform settings
| Name | Public or secret | Build/runtime need | Where the owner gets it | Dev-backed preview guidance | Production guidance |
|---|---|---|---|---|---|
| APP_ENV | Server mode, not a secret | Build and runtime, mandatory | Owner selects the environment explicitly | Explicit development/test mode, dev DB only | Explicit production mode; no fallback |
| DATABASE_URL | Secret, server-only | Build (current sitemap loads catalog) and runtime | Supabase Connect, transaction pooler | Dev project runtime connection only | Separate production runtime connection |
| DIRECT_URL | Secret, server-only | Current full server validation at build/runtime; migration use | Supabase Connect, direct or session pooler | Dev project direct/session connection | Production direct/session connection; never transaction pooler for migrations |
| SUPABASE_SERVICE_ROLE_KEY | Secret, server-only | Current full validation at build/runtime; Auth/Storage use | Supabase API settings | Dev administration key only | Production administration key only |
| UPLOAD_SESSION_SECRET | Secret, server-only | Current full validation at build/runtime; runtime HMAC | Password manager / cryptographic secret generator | Independent strong dev secret | Independent strong production secret; minimum length enforced |
| CRON_SECRET | Secret, server-only | Current full validation at build/runtime; runtime cron auth | Password manager / cryptographic secret generator | Independent strong dev secret | Independent strong production secret; Vercel supplies its bearer header |
| TURNSTILE_SECRET_KEY | Secret, server-only (published dummy keys are public test fixtures) | Build startup validation and runtime verification | Cloudflare widget settings / official test-key docs | Documented dummy key only in explicit dev-backed test mode | Real widget secret; never a dummy key |
| NEXT_PUBLIC_SUPABASE_URL | Public | Build-inlined and server use | Supabase API settings | Dev API endpoint | Production API endpoint |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Public anon/publishable key | Build-inlined and server use | Supabase API settings | Dev browser key; app-table RLS denies reads | Production browser key; verify production RLS separately |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | Public | Build-inlined; startup checks | Cloudflare widget settings / official test-key docs | Documented dummy site key in explicit development | Real widget site key for the approved production hostname |
| NEXT_PUBLIC_SITE_URL | Public, optional override | Build-inlined, metadata/server use | Approved deployment/custom domain | May be omitted for automatic platform resolution; explicit override if needed | Prefer the approved canonical custom origin before building |
| NEXT_PUBLIC_CONTACT_EMAIL | Public, optional | Build-inlined and server metadata/contact use | Owner-confirmed contact/deletion address | Optional public test/contact address; otherwise placeholder | Confirm the real public recruitment/deletion contact before launch |
| VERCEL | Public platform flag | Build/runtime fallback detection | Automatically exposed Vercel System Environment Variables | Automatic platform flag; do not invent it locally | Automatic platform flag |
| VERCEL_PROJECT_PRODUCTION_URL | Public platform hostname | Build/runtime URL fallback (preferred) | Vercel automatically supplies it | Used before deployment hostname if explicit site override is absent | Automatic project production hostname; custom override recommended |
| VERCEL_URL | Public deployment hostname | Build/runtime fallback | Vercel automatically supplies it | Fallback when project production hostname is unavailable | Fallback only; do not use a hostname as a secret |
| NODE_ENV | Framework-managed mode | Build/runtime | Next/Node tooling | Production compilation/runtime for deployed preview, independent of APP_ENV | Framework production mode; do not manually override it |
| DEV_SUPABASE_PROJECT_REF | Server identifier, not a credential | Optional app validation; required dev guards/owner tools | Independently copied dev dashboard reference | Pin existing dev project for guarded tests/tools | Dev identifier only for owner safety checks; no dev credentials |

Server secrets are required at build by the current statically generated sitemap/full server-schema validation as well as at runtime. Public variables are compiled into bundles: changing them requires a new build. None of the app's private keys may have a NEXT_PUBLIC prefix. Enable automatic platform-variable exposure when relying on URL fallback. Missing raw NEXT_PUBLIC_SITE_URL does not invalidate public settings; the resolved value is baked by next config.

## Owner maintenance (not normal deployed request settings)
| Name | Public or secret | Need | Value source | Dev usage | Production usage |
|---|---|---|---|---|---|
| ALLOWED_SUPABASE_PROJECT_REF | Private operator setting / identifier, not a credential | Owner CLI runtime only | Independently copied target dashboard reference | Explicitly approve the already pinned dev project | Explicitly approve production, distinct from dev; API/both DB URLs must match |
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
