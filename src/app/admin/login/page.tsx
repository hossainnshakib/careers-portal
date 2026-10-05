import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

/** Public login exception: it must be reachable before a user is authorized. */
export default function LoginPage() {
  return (
    <main id="main" className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <section className="w-full rounded-xl border border-border bg-card p-8">
        <p className="mb-2 text-sm text-muted-foreground">Careers Portal · Internal team</p>
        <h1 className="mb-6 text-2xl font-bold">Admin sign in</h1>
        <LoginForm />
      </section>
    </main>
  );
}
