/** Explicit coverage registry; discovery tests fail when a new surface is omitted. */
export const protectedPages = [
  "/admin",
  "/admin/applications",
  "/admin/applications/[id]",
  "/admin/mfa",
  "/admin/brands",
  "/admin/departments",
  "/admin/jobs",
  "/admin/jobs/new",
  "/admin/jobs/[id]/edit",
] as const;
export const actionFiles = {
  "login/actions.ts": ["login", "logout"],
  "(protected)/departments/actions.ts": ["saveDepartmentAction", "reorderDepartmentAction"],
  "(protected)/brands/actions.ts": [
    "saveBrandAction",
    "reorderBrandAction",
    "uploadBrandLogoAction",
  ],
  "(protected)/jobs/actions.ts": ["saveJobAction", "jobCommandAction", "copyJobQuestionsAction"],
  "(protected)/applications/actions.ts": ["changeStatusAction", "addNoteAction", "deleteNoteAction", "deleteApplicationAction"],
  "mfa/actions.ts": ["enrollMfaAction", "verifyMfaAction"],
} as const;
export const protectedApiRoutes = ["/api/admin/attachments/[id]", "/api/admin/applications/[id]/pdf"] as const;
