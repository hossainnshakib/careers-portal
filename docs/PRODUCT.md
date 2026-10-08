# PRODUCT — Careers Portal

## Purpose
One central place where people can discover and apply for jobs across a group of brands, and one place where the internal team reviews applications. It replaces third-party form tools. The owner controls the data.

Public URL (later): `careers.fixenmedia.com`. It is hosted separately from every brand website. Brand sites simply link to it, for example `careers.fixenmedia.com/?brand=doshok`.

## Brands (all have logos in `design/logos/`)
Fixen Media, Builtale, Doshok, Accoraze, Wiki Bangla, Ghora Fera, Mactie, Avagata. More can be added later from the admin panel. Brand pages and cards show only the brand's own logo, name and description. Do NOT write "mother company", "sister company", "part of Fixen Media", or any group-hierarchy wording anywhere in the UI.

## Users
- Candidate: public, anonymous, no account. Mostly on mobile, in Bangladesh. Names and answers may be in Bengali or English.
- Admin: a few internal team members. Log in with email + password (MFA later). Everyone has the same access.

## Candidate flow
Careers home → filter by brand / department / employment type / work mode (more filters hidden behind "More filters") and search → job detail → Apply → fill the dynamic form (upload CV/files where required) → submit → success page with a reference number.

A candidate must always see: which position, which brand(s), department, employment type, work mode, responsibilities, requirements, and the role-specific questions.

## Filters on the careers home
- Brand (multi) in one logo strip; Department, Employment type, Work mode, Sector (derived from the brand's sector), and Experience level in an expanded desktop sidebar/mobile sheet; free-text search over job title above results.
- Within one filter: OR. Across filters: AND.
- All filter state lives in the URL (`?brand=doshok,builtale&dept=design-creative&type=part_time&q=editor`). Brand-site links rely on this.
- When `?brand=<slug>` is present, preselect its strip toggle. A single selection can show its description and "See all brands" control without duplicating a large brand header.
- Show counts next to options; hide or grey options with zero open jobs.
- Mobile: non-brand filters open in a bottom sheet; brand toggles remain in the snap-scrolling strip. Selected filters/search show removable chips and clear controls.
- Role is not a filter. The job title is the role; use search plus department.
- Results are grouped in department sort order, all expanded, with numbered headings/counts and whole-card links in a responsive 3/2/1 grid. The hero counts open roles/active brands from the cached live catalog and links real job titles in a reduced-motion-safe CSS marquee. Applying steps, FAQ, brand website links and an environment-configured contact placeholder complete the public home.

## Admin capabilities (V1)
- Brands: create/edit/hide, logo upload, sector, accent colour, sort order.
- Departments: create/edit/reorder.
- Jobs: create, edit, duplicate, publish, close, reopen; assign one or more brands (one primary), department, employment type, work mode, optional level/location/deadline; markdown description, responsibilities, requirements; dynamic questions. Copy questions from another job.
- Dynamic questions (11 types): short text, long text, single choice, multiple choice, yes/no, number, URL, email, phone, file upload, date; required flag; help text; options; section; order. Single choice can use radio buttons or a dropdown. Single/multiple choice can allow an "Other" free-text answer. Date questions support minimum/maximum absolute dates or "today". Archiving instead of deleting once a job has applications.
- **"Add standard questions"** button in the job question builder: copies the seven defaults from `src/lib/questions/defaults.ts` (defined in `SEED_DATA.md`) into the job as ordinary editable questions. Admins can edit, reorder, or remove/archive the copies under the existing question rules. This is a code constant, not a DB table; changing the defaults does not change existing job questions. Combine these questions with role-specific ones. Do not ask for age, religion, marital status, or photos.
- Applications dashboard: counts by status (total, new, under review, shortlisted, rejected, hired); list with filters (brand, department, job, status, date range) and search by name/email; server-side pagination; all in the URL.
- Applicant profile page: header (name, position, brand(s), date, status), sections (personal & contact, professional, experience, skills, portfolio links, role-specific answers, attachments), status change, internal notes, download CV and other attachments separately, download Candidate Profile PDF.
- Candidate Profile PDF: clean professional layout; internal notes excluded by default (explicit toggle to include). Later maybe a "Profile + CV" package.

## Statuses
`new` → `under_review` → `shortlisted` → `hired` or `rejected`. Any admin can set any status at any time (no rigid workflow). Every change is logged with who and when.

## Jobs
- One job has one employment type. A role offered both full-time and part-time is two jobs (use "Duplicate job").
- A job can belong to several brands; one is marked primary (used on cards, PDF header, and reference display).
- Slugs are stable: once a job has been published its slug can never change (posters and QR codes point to it).
- Closed jobs stay reachable by URL and show "no longer accepting applications"; they are not listed.

## Out of scope for V1 (do not build)
Candidate accounts, interview scheduling, offer letters, payroll, employee management, attendance, HRMS, complex ATS automation, email automation or notifications, assessment engine, AI ranking, interview scorecards, calendar integrations, advanced permissions, multi-tenant architecture.

Admins learn about new applications from the dashboard "New" count (no email in V1).

## UX philosophy
Professional and branded, but simple. It must NOT look like a Google Form, a third-party form service, a generic HR SaaS, or a sprawling job marketplace. It should feel like a careers page for a group of well-known brands. Candidates should instantly understand the role, who is hiring, what is expected, and how to apply. Admins should be able to create a job, review, filter, update status, and export a profile with very few clicks.

## Data and privacy basics
Applicants' personal data and CVs are sensitive. Keep it private, minimise logging, and make deletion possible (admin can delete an application and its files). A short privacy note appears on the apply form (what is collected, who sees it).
