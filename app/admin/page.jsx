"use client";

import { useEffect, useState } from "react";
import AdminAuth, { useAdmin } from "@/components/AdminAuth";
import EmailComposer from "@/components/EmailComposer";
import SubscriberManager from "@/components/SubscriberManager";
import EmailTemplates from "@/components/EmailTemplates";
import AudienceManager from "@/components/AudienceManager";
import EventManager from "@/components/EventManager";
import StarManager from "@/components/StarManager";
import MarketingAgentTab from "@/components/MarketingAgentTab";
import AttendanceManager from "@/components/AttendanceManager";
import StarTierManager from "@/components/StarTierManager";
import SiteContentEditor from "@/components/SiteContentEditor";
import EventCheckinConfig from "@/components/EventCheckinConfig";
import {
  Mail,
  Send,
  FlaskConical,
  Calendar,
  ClipboardList,
  Users,
  Star,
  Layers,
  Zap,
  Bot,
  FileEdit,
  SlidersHorizontal,
  QrCode,
  BookOpen,
  X,
  Menu,
  ChevronRight,
} from "lucide-react";

// ─── Nav structure ─────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: "Email",
    items: [
      { id: "templates", label: "Templates", icon: Mail },
      { id: "compose", label: "Compose Email", icon: Send },
      { id: "test", label: "Test Email", icon: FlaskConical },
    ],
  },
  {
    label: "Events & Members",
    items: [
      { id: "events", label: "Events", icon: Calendar },
      { id: "attendance", label: "Attendance", icon: ClipboardList },
      { id: "checkin-config", label: "Check-In QR", icon: QrCode },
      { id: "subscribers", label: "Subscribers", icon: Users },
    ],
  },
  {
    label: "Rewards",
    items: [
      { id: "stars", label: "Stars", icon: Star },
      { id: "star-tiers", label: "Star Tiers", icon: Layers },
    ],
  },
  {
    label: "Tools",
    items: [
      { id: "marketing", label: "Marketing Agent", icon: Zap },
      { id: "center", label: "AI Center", icon: Bot },
      { id: "site-editor", label: "Site Editor", icon: FileEdit },
    ],
  },
  {
    label: "Settings",
    items: [
      { id: "audiences", label: "Audiences", icon: SlidersHorizontal, superAdminOnly: true },
    ],
  },
];

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ activeTab, onTabChange, isSuperAdmin, onClose, mobile }) {
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.superAdminOnly || isSuperAdmin),
  })).filter((group) => group.items.length > 0);

  return (
    <aside className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Brand header */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold"
              style={{ backgroundColor: "var(--byu-blue)" }}
            >
              ABS
            </div>
            <span className="text-base font-bold text-gray-900">ABS Admin</span>
          </div>
          <p className="mt-0.5 text-[11px] text-gray-400 tracking-wide">Dashboard</p>
        </div>
        {mobile && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onTabChange(item.id);
                        if (mobile) onClose();
                      }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "text-white"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                      style={active ? { backgroundColor: "var(--byu-blue)" } : {}}
                    >
                      <Icon size={15} className="shrink-0" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom spacer */}
      <div className="border-t border-gray-100 p-4" />
    </aside>
  );
}

// ─── User card ─────────────────────────────────────────────────────────────────
function UserCard({ adminSession }) {
  if (!adminSession) return null;
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
        style={{ backgroundColor: "var(--byu-blue)" }}
      >
        {(adminSession.email?.[0] || "A").toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-900 max-w-[140px]">
          {adminSession.email}
        </p>
        <span
          className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-tight ${
            adminSession.isSuperAdmin
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {adminSession.isSuperAdmin ? "Super Admin" : "Admin"}
        </span>
      </div>
    </div>
  );
}

// ─── Get label for active tab ──────────────────────────────────────────────────
function getTabLabel(tabId) {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => i.id === tabId);
    if (item) return item.label;
  }
  return "Dashboard";
}

// ─── Main dashboard ────────────────────────────────────────────────────────────
function AdminDashboard() {
  const adminSession = useAdmin();
  const [activeTab, setActiveTab] = useState("templates");
  const [emailData, setEmailData] = useState({ subject: "", content: "" });
  const [showGuide, setShowGuide] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("admin_welcome_seen");
    setShowGuide(!seen);
  }, []);

  function closeGuide() {
    if (dontShowAgain) {
      localStorage.setItem("admin_welcome_seen", "1");
    }
    setShowGuide(false);
  }

  const handleUseTemplate = (templateData) => {
    setEmailData(templateData);
    setActiveTab("compose");
  };

  const isSuperAdmin = adminSession?.isSuperAdmin ?? false;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fb]">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isSuperAdmin={isSuperAdmin}
          onClose={() => {}}
          mobile={false}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setSidebarOpen(false)}
          mobile
        />
      </div>

      {/* Main content column */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="flex items-center justify-center rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-1 text-sm text-gray-400">
              <span>Admin</span>
              <ChevronRight size={14} />
              <span className="font-semibold text-gray-900">{getTabLabel(activeTab)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UserCard adminSession={adminSession} />
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <BookOpen size={14} />
              <span className="hidden sm:inline">Help</span>
            </button>
          </div>
        </header>

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {activeTab === "templates" && (
                <div className="p-6">
                  <EmailTemplates onUseTemplate={handleUseTemplate} />
                </div>
              )}

              {activeTab === "compose" && (
                <div className="p-6">
                  <EmailComposer initialData={emailData} />
                </div>
              )}

              {activeTab === "test" && (
                <div className="p-6">
                  <TestEmailSender />
                </div>
              )}

              {activeTab === "events" && (
                <div className="p-6">
                  <EventManager />
                </div>
              )}

              {activeTab === "attendance" && (
                <div className="p-6">
                  <AttendanceManager />
                </div>
              )}

              {activeTab === "checkin-config" && (
                <div className="p-6">
                  <CheckInConfigTab />
                </div>
              )}

              {activeTab === "subscribers" && (
                <div className="p-6">
                  <SubscriberManager />
                </div>
              )}

              {activeTab === "stars" && (
                <div className="p-6">
                  <StarManager />
                </div>
              )}

              {activeTab === "star-tiers" && (
                <div className="p-6">
                  <StarTierManager />
                </div>
              )}

              {activeTab === "marketing" && (
                <div className="p-6">
                  <MarketingAgentTab />
                </div>
              )}

              {activeTab === "center" && (
                <div className="p-6">
                  <div className="flex flex-col items-center justify-center gap-6 py-12">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl text-white"
                      style={{ backgroundColor: "var(--byu-blue)" }}
                    >
                      <Bot size={32} />
                    </div>
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900">AI Center</h2>
                      <p className="mt-2 text-gray-500 max-w-sm">
                        AI-powered command center for managing the ABS website and automating tasks.
                      </p>
                    </div>
                    <a
                      href="/admin/center"
                      className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
                      style={{ backgroundColor: "var(--byu-blue)" }}
                    >
                      Open AI Center →
                    </a>
                  </div>
                </div>
              )}

              {activeTab === "site-editor" && (
                <div className="p-6">
                  <SiteContentEditor />
                </div>
              )}

              {activeTab === "audiences" && (
                <div className="p-6">
                  <AudienceManager />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Welcome guide modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Welcome to ABS Admin</h2>
              <button
                onClick={closeGuide}
                aria-label="Close"
                className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
              {[
                { icon: Mail, label: "Templates", desc: "Pick a template, add AI News, then use it." },
                { icon: Send, label: "Compose Email", desc: "Edit subject/content, select audiences, send." },
                { icon: FlaskConical, label: "Test Email", desc: "Send a test to verify your email setup." },
                { icon: Users, label: "Subscribers", desc: "Manage your subscriber lists." },
                { icon: Calendar, label: "Events", desc: "Create events and sync to Google Calendar." },
                { icon: QrCode, label: "Check-In QR", desc: "Generate QR codes for event check-in." },
                { icon: Star, label: "Stars", desc: "Award stars to members manually." },
                { icon: SlidersHorizontal, label: "Audiences", desc: "Manage audience groups (Super Admin)." },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-start gap-2 rounded-lg border border-gray-100 p-3">
                  <Icon size={16} className="mt-0.5 shrink-0 text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Don&apos;t show again
              </label>
              <button
                onClick={closeGuide}
                className="rounded-lg px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
                style={{ backgroundColor: "var(--byu-blue)" }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminAuth>
      <AdminDashboard />
    </AdminAuth>
  );
}

// ─── Check-In Config tab ───────────────────────────────────────────────────────
function CheckInConfigTab() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedEventTitle, setSelectedEventTitle] = useState("");

  useEffect(() => {
    fetch("/api/admin/events", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setEvents(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[color:var(--byu-blue)]">Event Check-In QR Codes</h2>
        <p className="mt-1 text-gray-600">
          Select an event to configure its check-in code and generate a QR code for students to scan.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Select Event</label>
        {loading ? (
          <p className="text-sm text-gray-400">Loading events…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-gray-400">No events found. Create events in the Events tab first.</p>
        ) : (
          <select
            value={selectedEventId}
            onChange={(e) => {
              const id = e.target.value;
              const ev = events.find((ev) => ev.id === id);
              setSelectedEventId(id);
              setSelectedEventTitle(ev?.title || "");
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
          >
            <option value="">— Select an event —</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
                {ev.event_date
                  ? ` · ${new Date(ev.event_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}`
                  : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedEventId && (
        <EventCheckinConfig eventId={selectedEventId} eventTitle={selectedEventTitle} />
      )}
    </div>
  );
}

// ─── Test email sender ─────────────────────────────────────────────────────────
function TestEmailSender() {
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const sendTestEmail = async () => {
    if (!testEmail.trim()) {
      alert("Please enter an email address");
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: testEmail }),
      });

      const data = await response.json();
      setResult(data);

      if (response.ok) {
        setTestEmail("");
      }
    } catch (error) {
      setResult({ error: "Failed to send test email" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-[color:var(--byu-blue)] mb-6">Test Email System</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Email Address
          </label>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
            placeholder="Enter email address to test..."
          />
        </div>

        <button
          onClick={sendTestEmail}
          disabled={sending}
          className="px-6 py-2 bg-[color:var(--byu-blue)] text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? "Sending..." : "Send Test Email"}
        </button>

        {result && (
          <div
            className={`p-4 rounded-md ${
              result.error
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {result.error ? (
              <p>Error: {result.error}</p>
            ) : result.simulated ? (
              <p>Test email simulated successfully (no actual email sent - API key not configured)</p>
            ) : (
              <p>Test email sent successfully!</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-md border border-gray-200">
        <h3 className="text-lg font-semibold text-[color:var(--byu-blue)] mb-2">About Test Emails</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
          <li>Test emails help verify your email configuration</li>
          <li>Uses the same system as the main email composer</li>
          <li>Safe to use - won&apos;t send to subscriber lists</li>
          <li>Check your spam folder if you don&apos;t receive the email</li>
        </ul>
      </div>
    </div>
  );
}
