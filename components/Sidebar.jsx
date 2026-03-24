"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  GraduationCap,
  Users,
  Briefcase,
  LogIn,
  Settings,
  CheckSquare,
  Crown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/student", label: "Student", icon: GraduationCap },
  { href: "/teacher", label: "Faculty", icon: Users },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/checkin", label: "Check In", icon: CheckSquare },
  { href: "/recruiting", label: "Recruiting", icon: Crown },
  { href: "/login", label: "Member Login", icon: LogIn },
  { href: "/admin", label: "Admin", icon: Settings },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  // Close mobile nav on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Sync collapsed state to a CSS variable on <html> so layout can respond
  useEffect(() => {
    document.documentElement.setAttribute("data-sidebar", collapsed ? "collapsed" : "expanded");
  }, [collapsed]);

  return (
    <>
      {/* Mobile top bar */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="AI in Business Society"
            width={640}
            height={160}
            className="h-8 w-auto object-contain"
          />
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100"
        >
          {mobileOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-out nav */}
      <nav
        className={`fixed left-0 top-14 z-50 flex h-[calc(100vh-3.5rem)] w-64 flex-col bg-white shadow-xl transition-transform duration-200 ease-out md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-1 flex-col gap-1 p-4">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors ${
                  active
                    ? "bg-[color:var(--byu-blue)]/10 text-[color:var(--byu-blue)]"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon size={18} className={active ? "text-[color:var(--byu-blue)]" : "text-gray-400"} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-gray-200 bg-white transition-all duration-200 ease-out md:flex ${
          collapsed ? "w-16" : "w-52"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center border-b border-gray-100 p-4">
          <Link href="/" className={collapsed ? "mx-auto" : ""}>
            {collapsed ? (
              <Image
                src="/logo.png"
                alt="ABS"
                width={640}
                height={160}
                className="h-8 w-8 object-cover object-left"
              />
            ) : (
              <Image
                src="/logo.png"
                alt="AI in Business Society"
                width={640}
                height={160}
                className="h-12 w-auto object-contain"
              />
            )}
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex flex-1 flex-col gap-1 p-2 text-sm">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors ${
                  collapsed ? "justify-center px-0" : ""
                } ${
                  active
                    ? "bg-[color:var(--byu-blue)]/10 text-[color:var(--byu-blue)]"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon
                  size={collapsed ? 20 : 16}
                  className={active ? "text-[color:var(--byu-blue)]" : "text-gray-400"}
                />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center gap-2 border-t border-gray-100 p-3 text-xs font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} />
          ) : (
            <>
              <PanelLeftClose size={16} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </aside>
    </>
  );
}
