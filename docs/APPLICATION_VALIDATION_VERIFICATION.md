# Application validation investigation — 2026-10-17

## Outcome and limits

Branch: `fix-application-validation`, based on fetched `origin/main` `d5d2fce`,
in the separate `G:\career-validation` worktree. Existing worktrees/user edits
were preserved. No dependency, migration, schema, policy, environment file,
deployment setting or infrastructure change was made.

**The reported populated-form rejection was not reproduced and its root cause
is not confirmed.** Do not describe this patch as a proven fix for that event.
The confirmed defect addressed here is lost/inconsistent validation feedback:
the server discarded known field paths, missing CV used an unstructured error,
and upload/consent/dynamic-control errors were not consistently associated with
controls or focused. No accepted input or anti-abuse rule was relaxed.

## Trace of the reported message

1. The React Hook Form submit handler validates contact details and configured
   answers, normalizes selected Other text, checks CV/consent, obtains the existing
   upload session, then requires a fresh Turnstile token.
2. The exact message `Check your application fields and try again.` originally
   came from the first server-action branch: failed `applicationInputSchema`
   validation **or** a populated honeypot. This location alone does not identify
   which condition caused the owner's event.
3. Turnstile verification, session validation/minimum elapsed time, idempotent
   existing-session lookup, authoritative job/question reload, dynamic validation,
   file ownership/MIME/size/content verification, moves and transactional inserts
   all happen after that envelope/honeypot gate. They have different failure
   responses. Their controls and ordering remain in place.
4. A successful controlled live request used the standard Next server-action
   POST to the Apply page with a `Next-Action` header, not a separately named
   application REST endpoint. The absence of a recognizable REST URL in the
   owner's Network panel does not establish that no server action was sent.

## Direct deployed-live verification (before patch)

- Target: the owner-authorized DEV deployment
  `https://careers-portal-sigma.vercel.app`, backed by authorized project
  `xmtoccukridshadnxrlc`. Local APP_ENV, independent project pin, API host and both
  database targets were checked; deployment public-origin/data correlation and
  prior explicit shared-DEV authorization are documented in DECISIONS.md.
  No claim of privileged access to deployed environment-variable settings.
- Existing published job: `demo-platform-developer`.
- Exactly **one** intentional submission attempt, using fictional information,
  a generated synthetic PDF for CV/work sample, required answers, normal upload
  endpoints/direct Storage uploads, consent and configured Cloudflare workflow.
  No network interception, forged tokens, injected challenge callbacks, honeypot
  modification, validation bypass or direct application-row insert.
- The outgoing action envelope was validated in memory against the same input
  schema. Only pass/fail, issue paths/codes, field types and an empty-honeypot
  boolean were recorded; no payload values or security tokens were saved.
- Required answers passed with optional fields untouched. Optional undefined
  answers, numeric and boolean values and two opaque file references were accepted.
- Actual success redirect: **`APP-WS2Z7R`**. DEV count **0 -> 1**. Persistence was
  checked before the only submit and after it; no retry or second submission.
- Final read-only check: reference still present, status `new`, correct job,
  consent recorded, **6 answer rows / 2 attachment rows**, total applications 1,
  all five DEMO jobs still open. The application is left intact for owner review.

This verifies the existing deployed valid path, **not deployment of this patch**.
Admin login/MFA, admin profile/downloads/PDF and post-patch live behavior were not
tested. Those were not bypassed or simulated.

## Changes

- `src/lib/validation/application-feedback.ts`: typed, allowlisted static
  field-error responses; never return raw Zod issues, input values, security
  field names, unknown question keys or provider details.
- `src/lib/validation/application.ts`: preserve the required-CV rule but give
  its error a structured `cv` path.
- `src/app/(public)/jobs/[slug]/apply/actions.ts`: return safe known field errors
  for invalid input/current dynamic answers. Honeypot/security denials stay
  generic; DB definitions, Turnstile/session/file verification, recovery and
  idempotency remain authoritative and unchanged.
- `src/components/public/application-form.tsx`: collect/display known field
  errors, retain entered values, connect consent feedback, handle server field
  errors and focus/scroll to the first invalid control. Missing CV focuses the
  visible chooser, not the visually hidden file input.
- `src/components/public/upload-widget.tsx`: link file errors to the real upload
  input with `aria-invalid`/`aria-describedby`.
- `src/components/form-renderer/question-fields.tsx`: link errors/help directly
  to inputs/selects/Other controls as well as their fieldset.
- Tests: `src/lib/validation/application-feedback.test.ts`,
  `src/app/(public)/jobs/[slug]/apply/actions.test.ts`,
  `src/components/public/application-form.test.ts`,
  `tests/e2e/application-validation.spec.ts`.
- `playwright.validation.config.ts`: targeted non-persisting browser checks,
  without account/catalog setup, global account sweeps, retries or cleanup.
- Documentation: this file and `docs/DECISIONS.md`.

## Regression evidence and quality gates

| Check | Final result |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS |
| `pnpm test` | PASS: 689 tests; 90 existing opt-in skips; 99 files passed / 8 skipped |
| `pnpm build` (existing external DEV environment loaded privately) | PASS, including embedded lint/types and PDF trace guard |
| `PLAYWRIGHT_PRODUCTION=1` targeted validation config | PASS: 1/1 Chromium case against local `next start` |
| Live public normal submission before patch | PASS: one redirect/reference and persisted application |
| Original owner's rejection reproduced/root-caused | NOT ESTABLISHED |
| New patch deployed/live-verified | NOT TESTED; deployment was not requested/performed |

Unit tests use mocks at external boundaries and verify safe envelope/dynamic/CV
errors, legitimate success, optional blanks/undefined, zero/false, numeric/date
and file-token types, malformed answers/references, filled honeypot, bad security
tokens, failed Turnstile, expired/too-young sessions, closed jobs, storage failures,
idempotent reuse and lost-commit recovery. They are not live security-service tests.

The targeted browser test exercises real React Hook Form/Zod/rendering against
the existing DEMO job in a production-mode localhost app: invalid contact email,
missing CV/consent/answers, invalid integer/date/optional email, linked error IDs,
first-invalid focus, visible upload-button focus, error refresh, value preservation
and **zero application action requests**. It completes the configured development
security workflow normally but never uploads or submits a valid application.

No broad live integration or legacy browser fixture suite was run: those have
account/data sweeps and application deletion/cleanup paths inappropriate for the
retained review application. No existing assertion/skip was weakened.

Earlier invocation issues were corrected without code/dependency changes:
Node `--run` did not forward the env-file settings as expected; direct Next CLI
initially reported plugin resolution trouble whereas the normal `pnpm build`
passed cleanly. One typecheck raced a concurrent build deleting `.next/types`;
the final standalone typecheck after build passed. Final checks above are the
actual successful runs, not claims that these initial attempts passed.

## Evidence and next step

Local synthetic-only evidence is outside git at:
`C:\Users\Hossa\AppData\Local\Temp\opencode\demo-review-20261017`:
`investigation.json`, `investigation-live-result.png`, `synthetic-review.pdf`,
`final-persistence.json`. No auth state, signed URLs, challenge tokens or real
applicant information was saved. Earlier preflight reports in that directory
describe the previous stopped task and are superseded only for current outcome
by this investigation report.

To diagnose the original event if it recurs, obtain the browser/version,
reproduction steps and new highlighted **field names/static error messages**,
not candidate values or tokens. If the response remains generic, inspect the
failure privately with the owner; do not infer a honeypot, Turnstile or validation
cause without evidence. Do not resubmit the retained candidate to reproduce it.
