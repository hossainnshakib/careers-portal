export function AdminAuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="admin-auth">
      <div aria-hidden="true" className="admin-orb" style={{ width: 420, height: 420, background: "#2F6BFF", left: -100, top: -120 }} />
      <div aria-hidden="true" className="admin-orb" style={{ width: 360, height: 360, background: "#EC1C24", right: -80, bottom: -80 }} />
      <section className="admin-card admin-auth-card">
        <div className="admin-wordmark">Careers admin<i aria-hidden="true" /></div>
        {children}
      </section>
    </main>
  );
}
