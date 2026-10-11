"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./logout-button";

const navItems: [string, string][] = [
  ["Dashboard", "/admin"],
  ["Applications", "/admin/applications"],
  ["Jobs", "/admin/jobs"],
  ["Brands", "/admin/brands"],
  ["Departments", "/admin/departments"],
  ["Options", "/admin/options"],
];

function isActiveLink(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarFooter({ email }: { email: string }) {
  return (
    <div className="admin-sidebar-footer">
      <p style={{ margin: 0, overflowWrap: "anywhere" }}>{email}</p>
      <LogoutButton />
    </div>
  );
}

export function AdminShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>("button, a")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
      if (event.key === "Tab") {
        const controls = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)") ?? []);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  return (
    <>
      <div className="admin-orb" style={{ width: 420, height: 420, background: "#EC1C24", left: -120, top: -100 }} />
      <div className="admin-orb" style={{ width: 380, height: 380, background: "#2F6BFF", left: 400, top: -200 }} />
      <div className="admin-orb" style={{ width: 360, height: 360, background: "#0AA278", left: -100, top: 560 }} />

      <aside className="admin-sidebar">
        <a href="/admin" className="admin-wordmark">
          Careers admin<i aria-hidden="true" />
        </a>
        <nav aria-label="Admin navigation">
          {navItems.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className={`admin-nav-link${isActiveLink(pathname, href) ? " is-active" : ""}`}
            >
              {label}
            </a>
          ))}
        </nav>
        <SidebarFooter email={email} />
      </aside>

      <div className="admin-topbar">
        <a href="/admin" className="admin-wordmark">
          Careers admin<i aria-hidden="true" />
        </a>
        <span className="admin-spacer" />
        <button
          ref={menuButtonRef}
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-sm"
          aria-label="Menu"
          aria-expanded={menuOpen}
          aria-controls="admin-mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          ☰
        </button>
      </div>

      {menuOpen && (
        <div
          className="admin-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setMenuOpen(false);
              menuButtonRef.current?.focus();
            }
          }}
        >
          <aside ref={menuRef} id="admin-mobile-menu" className="admin-sidebar" role="dialog" aria-modal="true" aria-label="Admin navigation menu">
            <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" aria-label="Close menu" onClick={() => { setMenuOpen(false); menuButtonRef.current?.focus(); }}>Close menu</button>
            <a href="/admin" className="admin-wordmark">
              Careers admin<i aria-hidden="true" />
            </a>
            <nav aria-label="Admin navigation">
              {navItems.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className={`admin-nav-link${isActiveLink(pathname, href) ? " is-active" : ""}`}
                >
                  {label}
                </a>
              ))}
            </nav>
            <SidebarFooter email={email} />
          </aside>
        </div>
      )}

      <main id="main" className="admin-main" inert={menuOpen}>
        {children}
      </main>
    </>
  );
}
