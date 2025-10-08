"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import AdminAuth, { useAdmin } from "@/components/AdminAuth";
import EmailComposer from "@/components/EmailComposer";
import SubscriberManager from "@/components/SubscriberManager";
import EmailTemplates from "@/components/EmailTemplates";
import AudienceManager from "@/components/AudienceManager";

function AdminDashboard() {
  const adminSession = useAdmin();
  const [activeTab, setActiveTab] = useState("templates");
  const [emailData, setEmailData] = useState({ subject: "", content: "" });
  const [showGuide, setShowGuide] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('admin_welcome_seen');
    setShowGuide(!seen);
  }, []);

  function closeGuide() {
    if (dontShowAgain) {
      localStorage.setItem('admin_welcome_seen', '1');
    }
    setShowGuide(false);
  }

  const handleUseTemplate = (templateData) => {
    setEmailData(templateData);
    setActiveTab("compose");
  };

  // Filter tabs based on admin permissions
  const allTabs = [
    { id: "templates", label: "Templates" },
    { id: "compose", label: "Compose Email" },
    { id: "test", label: "Test Email" },
    { id: "subscribers", label: "Subscribers" },
    { id: "audiences", label: "Audiences", superAdminOnly: true }
  ];

  const tabs = allTabs.filter(tab => {
    if (tab.superAdminOnly && adminSession && !adminSession.isSuperAdmin) {
      return false;
    }
    return true;
  });

  return (
    <div className="relative bg-white min-h-screen">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute right-[-6rem] md:right-[-8rem] xl:right-[-14rem] 2xl:right-[-18rem] top-0 h-[80vh] w-1/2 min-w-[560px] md:min-w-[640px] xl:min-w-[780px]">
            <Image
              src="/shaka_clear.png"
              alt="Background shaka hand"
              fill
              priority
              className="object-contain object-right opacity-90 scale-125 xl:scale-115 2xl:scale-110 origin-right"
              sizes="66vw"
            />
          </div>
        </div>
        
        <section className="relative z-10 py-8 pl-0 pr-8 sm:pl-0 sm:pr-12 lg:pl-0 lg:pr-24 xl:pr-40 2xl:pr-56 -ml-6 sm:-ml-6 lg:-ml-8 xl:-ml-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[color:var(--byu-blue)]">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Manage email campaigns and subscriber lists for AI in Business Society
              {adminSession && (
                <span className="ml-2 text-sm">
                  • Logged in as: <strong>{adminSession.email}</strong>
                  {adminSession.isSuperAdmin ? (
                    <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">SuperAdmin</span>
                  ) : (
                    <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">Normal Admin</span>
                  )}
                </span>
              )}
            </p>
          </div>

            {/* Tab Navigation */}
            <div className="mb-8">
              <nav className="flex space-x-8 border-b border-gray-200">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-[color:var(--byu-blue)] text-[color:var(--byu-blue)]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              {activeTab === "compose" && (
                <div className="p-6">
                  <EmailComposer initialData={emailData} />
                </div>
              )}
              
              {activeTab === "templates" && (
                <div className="p-6">
                  <EmailTemplates onUseTemplate={handleUseTemplate} />
                </div>
              )}

              {activeTab === "audiences" && (
                <div className="p-6">
                  <AudienceManager />
                </div>
              )}
              
              {activeTab === "subscribers" && (
                <div className="p-6">
                  <SubscriberManager />
                </div>
              )}
              
              {activeTab === "test" && (
                <div className="p-6">
                  <TestEmailSender />
                </div>
              )}
            </div>
        </section>
      
      {showGuide && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-md bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[color:var(--byu-blue)]">Welcome to the Admin Dashboard</h2>
              <button onClick={closeGuide} aria-label="Close" className="px-2 py-1">✕</button>
            </div>
            <div className="mt-3 text-sm text-gray-700 space-y-2">
              <p><strong>Templates</strong>: Pick a template, add AI News or extra info, then “Use This Template.”</p>
              <p><strong>Compose Email</strong>: Edit subject/content, select audiences, and send (or test mode).</p>
              <p><strong>Test Email</strong>: Send a one-off test to verify setup.</p>
              <p><strong>Subscribers</strong>: Manage your subscriber lists.</p>
              <p><strong>Audiences</strong>: Create and manage audience groups; optionally create in Resend.</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} />
                <span>Don’t show again</span>
              </label>
              <button onClick={closeGuide} className="rounded-md bg-[color:var(--byu-blue)] px-4 py-2 text-white font-semibold">Got it</button>
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
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
          {sending ? 'Sending...' : 'Send Test Email'}
        </button>

        {result && (
          <div className={`p-4 rounded-md ${result.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
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
          <li>Safe to use - won't send to subscriber lists</li>
          <li>Check your spam folder if you don't receive the email</li>
        </ul>
      </div>
    </div>
  );
}


