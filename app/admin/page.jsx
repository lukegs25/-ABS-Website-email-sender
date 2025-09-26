"use client";
import Image from "next/image";
import { useState } from "react";
import AdminAuth from "@/components/AdminAuth";
import EmailComposer from "@/components/EmailComposer";
import SubscriberManager from "@/components/SubscriberManager";
import EmailTemplates from "@/components/EmailTemplates";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("compose");
  const [emailData, setEmailData] = useState({ subject: "", content: "" });

  const handleUseTemplate = (templateData) => {
    setEmailData(templateData);
    setActiveTab("compose");
  };

  const tabs = [
    { id: "compose", label: "Compose Email" },
    { id: "templates", label: "Templates" },
    { id: "subscribers", label: "Subscribers" },
    { id: "test", label: "Test Email" }
  ];

  return (
    <AdminAuth>
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
            <p className="mt-2 text-gray-600">Manage email campaigns and subscriber lists for AI in Business Society</p>
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
      </div>
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


