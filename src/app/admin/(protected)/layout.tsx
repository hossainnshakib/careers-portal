import { requireAdmin } from "@/lib/auth/requireAdmin";
import { redirectAdminDenial } from "@/lib/auth/page-denial";
import { LogoutButton } from "@/components/admin/logout-button";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin().catch(redirectAdminDenial);
  return (
    <div className="min-h-screen md:grid md:grid-cols-[15rem_1fr]">
      <aside className="border-b border-border bg-card p-5 md:border-r md:border-b-0">
        <a href="/admin" className="text-lg font-bold">
          Careers admin
        </a>
        <nav aria-label="Admin navigation" className="my-6 flex flex-wrap gap-2 md:flex-col">
          {[
            ["Dashboard", "/admin"],
            ["Applications", "/admin/applications"],
            ["Jobs", "/admin/jobs"],
            ["Brands", "/admin/brands"],
            ["Departments", "/admin/departments"],
            ["Options", "/admin/options"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="rounded px-3 py-2 hover:bg-secondary">
              {label}
            </a>
          ))}
        </nav>
        <p className="mb-3 break-all text-sm text-muted-foreground">{admin.email}</p>
        <LogoutButton />
      </aside>
      <main id="main" className="min-w-0 p-5 md:p-10">{children}</main>
    </div>
  );
}
