"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
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
  User,
  LogOut,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

const primaryNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/#calendar", label: "Events", icon: Calendar },
];

const userLinks = [
  { href: "/member", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Member Settings", icon: Settings },
  { href: "/checkin", label: "Check In", icon: CheckSquare },
  { href: "/recruiting", label: "Recruiting", icon: Crown },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true); // Start collapsed
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [user, setUser] = useState(null);
  const sidebarRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  // Auth via Supabase client
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
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

  // Desktop: expand on hover, collapse when mouse leaves (unless pinned)
  const isExpanded = pinned || hovered;

  // Sync to CSS
  useEffect(() => {
    document.documentElement.setAttribute(
      "data-sidebar",
      isExpanded ? "expanded" : "collapsed"
    );
  }, [isExpanded]);

  const togglePin = () => {
    setPinned((p) => !p);
  };

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

          {/* User section — always expanded, no dropdown toggle */}
          {user ? (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-3 rounded-lg px-3 py-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-7 w-7 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--byu-blue)]/10 text-[color:var(--byu-blue)]">
                    <User size={16} />
                  </div>
                )}
                <span className="flex-1 truncate text-base font-semibold text-gray-900">{displayName}</span>
              </div>
              {userLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-[color:var(--byu-blue)]/10 text-[color:var(--byu-blue)]"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={16} className={active ? "text-[color:var(--byu-blue)]" : "text-gray-400"} />
                    {label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                Logout
              </button>
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

      {/* Desktop sidebar — auto-collapses, expands on hover */}
      <aside
        ref={sidebarRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-gray-200 bg-white transition-all duration-200 ease-out md:flex ${
          isExpanded ? "w-52" : "w-16"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center border-b border-gray-100 p-4">
          <Link href="/" className={!isExpanded ? "mx-auto" : ""}>
            {!isExpanded ? (
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
                title={!isExpanded ? label : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors ${
                  !isExpanded ? "justify-center px-0" : ""
                } ${
                  active
                    ? "bg-[color:var(--byu-blue)]/10 text-[color:var(--byu-blue)]"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon
                  size={!isExpanded ? 20 : 16}
                  className={active ? "text-[color:var(--byu-blue)]" : "text-gray-400"}
                />
                {isExpanded && label}
              </Link>
            );
          })}

          <div className="my-1 border-t border-gray-100" />

          {/* User section — always visible when expanded (no dropdown) */}
          {user && isExpanded && (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-3 rounded-lg px-3 py-2">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="h-6 w-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--byu-blue)]/10 text-[color:var(--byu-blue)]">
                    <User size={14} />
                  </div>
                )}
                <span className="flex-1 truncate text-sm font-semibold text-gray-900">{displayName}</span>
              </div>
              {userLinks.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      active
                        ? "bg-[color:var(--byu-blue)]/10 text-[color:var(--byu-blue)]"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={14} className={active ? "text-[color:var(--byu-blue)]" : "text-gray-400"} />
                    {label}
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}

          {/* Collapsed user icon */}
          {user && !isExpanded && (
            <Link
              href="/member"
              title={displayName}
              className="flex items-center justify-center rounded-lg py-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="h-6 w-6 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={20} />
              )}
            </Link>
          )}

          {/* Login link */}
          {!user && (
            <Link
              href="/login"
              title={!isExpanded ? "Login" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-medium transition-colors ${
                !isExpanded ? "justify-center px-0" : ""
              } ${
                pathname === "/login"
                  ? "bg-[color:var(--byu-blue)]/10 text-[color:var(--byu-blue)]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <LogIn
                size={!isExpanded ? 20 : 16}
                className={pathname === "/login" ? "text-[color:var(--byu-blue)]" : "text-gray-400"}
              />
              {isExpanded && "Login"}
            </Link>
          )}
        </nav>

        {/* Pin/collapse toggle */}
        <button
          onClick={togglePin}
          className="flex items-center justify-center gap-2 border-t border-gray-100 p-3 text-xs font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
          title={pinned ? "Unpin sidebar" : "Pin sidebar open"}
        >
          {isExpanded ? (
            <>
              <PanelLeftClose size={16} />
              {pinned ? <span>Unpin</span> : <span>Pin open</span>}
            </>
          ) : (
            <PanelLeftOpen size={18} />
          )}
        </button>
      </aside>
    </>
  );
}
