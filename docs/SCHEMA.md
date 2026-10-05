# SCHEMA — Careers Portal

Postgres (Supabase), managed with Drizzle migrations. Primary keys are `uuid` (default `gen_random_uuid()`), timestamps are `timestamptz` UTC. Enable RLS on EVERY table with no policies (in a migration). Add the listed indexes.

## Enums
- `sector`: `creative_agency | real_estate | fashion | saas | media | technology | other`
- `employment_type`: `full_time | part_time | contract | internship | freelance`
- `work_mode`: `onsite | remote | hybrid`
- `experience_level`: `entry | mid | senior`
- `job_status`: `draft | open | closed`
- `brand_status`: `active | hidden`
- `question_type` (11 types): `short_text | long_text | single_choice | multiple_choice | yes_no | number | url | email | phone | file_upload | date`
- `question_section`: `professional | experience | skills | portfolio | role_specific`
- `application_status`: `new | under_review | shortlisted | rejected | hired`
- `attachment_kind`: `cv | portfolio | other`

## Tables

### departments
`id`, `name`, `slug` (unique), `sort_order int`, `is_active bool default true`, `created_at`.

### brands
`id`, `name`, `slug` (unique), `sector`, `logo_url text null` (static `/brands/<slug>.svg` for seeded brands, or a public Storage URL for uploads), `description text`, `website text null`, `accent_color text null` (hex), `status brand_status default active`, `sort_order int`, `created_at`.

### jobs
`id`, `title`, `slug` (unique), `department_id` → departments (restrict), `employment_type`, `work_mode`, `experience_level null`, `location_text null`, `summary text` (≤ 200 chars, shown on cards), `description_md`, `responsibilities_md`, `requirements_md`, `cv_required bool default true`, `status job_status default draft`, `published_at null`, `closed_at null`, `deadline_at null`, `sort_order int`, `created_at`, `updated_at`.
Rules: **slug is immutable once `published_at` is set** (enforce in the server action AND with a DB trigger). Publishing sets `published_at` (first time only) and `status=open`; closing sets `status=closed`, `closed_at=now()`; reopening sets `status=open`, `closed_at=null`. A job must have at least one brand (enforced by the application layer); questions are optional.
Indexes: `(status)`, `(department_id)`, `(sort_order)`.

### job_brands
`job_id` → jobs (cascade), `brand_id` → brands (restrict), `is_primary bool`. PK `(job_id, brand_id)`. Partial unique index: one primary per job (`where is_primary`). Application layer guarantees exactly one primary.

### job_questions
`id`, `job_id` → jobs (cascade), `label`, `help_text null`, `type question_type`, `required bool`, `options jsonb null` (array of `{ value, label }` for choice types), `config jsonb null` (e.g. `{ minLength, maxLength, min, max, integer, minSelected, maxSelected, display, allowOther, accept: ["pdf","png"], maxSizeMb }`), `section question_section default role_specific`, `sort_order int`, `archived_at null`, `created_at`.
Config extensions:
- `single_choice`: `display: "radio" | "dropdown"` controls presentation; `allowOther: bool` enables an "Other" free-text answer.
- `multiple_choice`: `allowOther: bool` enables an "Other" free-text answer alongside selected options.
- `date`: `min` and `max` are an absolute ISO calendar date (`YYYY-MM-DD`) or `"today"`. Bounds are inclusive; resolve `"today"` at validation time, not when the question is saved. A date answer is a date-only string, not a timestamp.
Rules: once a job has applications, questions are archived, never deleted. Editing a question after applications exist only affects future applications (answers carry snapshots).
Index: `(job_id, sort_order)`.

### applications
`id`, `reference text unique`, `job_id` → jobs (restrict), `full_name`, `email`, `phone`, `location`, `status application_status default new`, snapshots: `job_title_snapshot`, `job_slug_snapshot`, `department_name_snapshot`, `brand_names_snapshot text[]`, `primary_brand_snapshot text`, `submitted_at`, `status_changed_at`.
Indexes: `(job_id)`, `(status)`, `(submitted_at desc)`, `lower(email)`. "Previous applications from this email" is computed at read time by `lower(email)`.

### application_answers
`id`, `application_id` → applications (cascade), `question_id` → job_questions (set null), `label_snapshot`, `type_snapshot question_type`, `section_snapshot question_section`, `sort_order int`, `value jsonb` (string | number | boolean | string[] | null; file_upload answers store the attachment id(s)).
Date answers use ISO date-only strings (`YYYY-MM-DD`). "Other" answers are stored as plain text in `value`: a string for single choice, or a free-text string within the multiple-choice answer array. Do not store HTML or a separate "Other" object; render answers as text.
Index: `(application_id)`.

### attachments
`id`, `application_id` → applications (cascade), `question_id` → job_questions (set null), `kind attachment_kind`, `storage_path`, `file_name` (original, sanitised for display), `mime_type`, `size_bytes int`, `created_at`.
Index: `(application_id)`.

### admin_notes
`id`, `application_id` → applications (cascade), `admin_user_id uuid` (auth user id), `admin_email_snapshot`, `note text`, `created_at`.

### application_status_events
`id`, `application_id` → applications (cascade), `from_status null`, `to_status`, `admin_user_id uuid null`, `created_at`.

### admin_users
`user_id uuid` PK (the Supabase auth user id), `email`, `role text default 'admin'`, `created_at`. This is the allowlist checked by `requireAdmin()`.

## Storage buckets
- `applications` — PRIVATE. Paths: `pending/<sessionId>/<uuid>-<name>` then `applications/<applicationId>/<uuid>-<name>`.
- `brand-assets` — PUBLIC (non-sensitive logos only). Accept svg/png/webp, ≤ 1 MB. Reject SVGs that contain `<script`, `on*=` attributes, `javascript:` URLs or `<foreignObject`.
- Uploaded SVGs use a conservative passive-shape/attribute allowlist: gradients, local ID references, masks and clipping are supported; scripts, events, style elements/attributes, external resources, entities/DTDs, images, animation and unknown markup are rejected. Raster uploads must match their PNG/WebP signatures. Admin-uploaded filenames are not used as storage paths; the server chooses a UUID path.

## Migrations notes
- A migration enables RLS on all tables, creates the partial unique index for the primary brand, and creates the slug-immutability trigger.
- Seed data is NOT in migrations (see `docs/SEED_DATA.md`).
- `date` is a Phase 1 schema extension. The applied Phase 0 enum has ten types; add `date` through a **NEW migration in Phase 1** and update the Drizzle enum then. Never edit an applied migration to add it.
