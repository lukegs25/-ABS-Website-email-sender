"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Mail,
  Briefcase,
  Calendar,
  LogIn,
  Settings,
  CheckSquare,
  Crown,
  LayoutDashboard,
  Trophy,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  User,
  LogOut,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const primaryNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/join", label: "Join Email", icon: Mail },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/#calendar", label: "Events", icon: Calendar },
];

const dropdownLinks = [
  { href: "/member", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Member Settings", icon: Settings },
  { href: "/checkin", label: "Check In", icon: CheckSquare },
  { href: "/recruiting", label: "Recruiting", icon: Crown },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileUserDropdownOpen, setMobileUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const mobileUserDropdownRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (mobileUserDropdownRef.current && !mobileUserDropdownRef.current.contains(e.target)) {
        setMobileUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setUserDropdownOpen(false);
    setMobileUserDropdownOpen(false);
    router.push("/");
    router.refresh();
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Member";

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture;

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
          {primaryNavLinks.map(({ href, label, icon: Icon }) => {
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

          <div className="my-2 border-t border-gray-100" />

          {user ? (
            <div ref={mobileUserDropdownRef}>
              <button
                type="button"
                onClick={() => setMobileUserDropdownOpen((v) => !v)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-6 w-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={18} className="text-gray-400" />
                )}
                <span className="flex-1 truncate text-left">{displayName}</span>
                <ChevronDown size={16} className={`transition-transform ${mobileUserDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {mobileUserDropdownOpen && (
                <div className="ml-4 flex flex-col gap-0.5">
                  {dropdownLinks.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      onClick={() => { setMobileUserDropdownOpen(false); setMobileOpen(false); }}
                    >
                      <Icon size={16} className="text-gray-400" />
                      {label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors ${
                pathname === "/login"
                  ? "bg-[color:var(--byu-blue)]/10 text-[color:var(--byu-blue)]"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <LogIn size={18} className={pathname === "/login" ? "text-[color:var(--byu-blue)]" : "text-gray-400"} />
              Login
            </Link>
          )}
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
          {primaryNavLinks.map(({ href, label, icon: Icon }) => {
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

          <div className="my-1 border-t border-gray-100" />

          {/* Login / User dropdown */}
          {user ? (
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen((v) => !v)}
                title={collapsed ? displayName : undefined}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors ${
                  collapsed ? "justify-center px-0" : ""
                }`}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-5 w-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={collapsed ? 20 : 16} className="text-gray-400 shrink-0" />
                )}
                {!collapsed && (
                  <>
                    <span className="flex-1 truncate text-left text-sm">{displayName}</span>
                    <ChevronDown size={14} className={`transition-transform ${userDropdownOpen ? "rotate-180" : ""}`} />
                  </>
                )}
              </button>
              {userDropdownOpen && !collapsed && (
                <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {dropdownLinks.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <Icon size={14} className="text-gray-400" />
                      {label}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              title={collapsed ? "Login" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors ${
                collapsed ? "justify-center px-0" : ""
              } ${
                pathname === "/login"
                  ? "bg-[color:var(--byu-blue)]/10 text-[color:var(--byu-blue)]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <LogIn
                size={collapsed ? 20 : 16}
                className={pathname === "/login" ? "text-[color:var(--byu-blue)]" : "text-gray-400"}
              />
              {!collapsed && "Login"}
            </Link>
          )}
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
