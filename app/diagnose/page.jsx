"use client";
import { useState } from "react";

export default function DiagnosticPage() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/diagnose-email');
      const data = await response.json();
      setDiagnostics(data);
    } catch (error) {
      setDiagnostics({
        overall: '❌ FAILED TO RUN DIAGNOSTICS',
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS': return 'bg-green-100 text-green-800 border-green-300';
      case 'FAIL': return 'bg-red-100 text-red-800 border-red-300';
      case 'ERROR': return 'bg-red-100 text-red-900 border-red-400';
      case 'SKIP': return 'bg-gray-100 text-gray-600 border-gray-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASS': return '✅';
      case 'FAIL': return '❌';
      case 'ERROR': return '🔥';
      case 'SKIP': return '⏭️';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-[color:var(--byu-blue)] mb-2">
            🔍 Email System Diagnostics
          </h1>
          <p className="text-gray-600 mb-6">
            Test all components of the email sending system
          </p>

          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="px-6 py-3 bg-[color:var(--byu-blue)] text-white rounded-md hover:opacity-90 disabled:opacity-50 font-semibold text-lg mb-8"
          >
            {loading ? '🔄 Running Diagnostics...' : '▶️ Run Diagnostics'}
          </button>

          {diagnostics && (
            <div className="space-y-6">
              {/* Overall Status */}
              <div className={`p-6 rounded-lg border-2 ${
                diagnostics.overall.includes('ALL TESTS PASSED') 
                  ? 'bg-green-50 border-green-300' 
                  : diagnostics.overall.includes('CRITICAL')
                  ? 'bg-red-50 border-red-300'
                  : 'bg-yellow-50 border-yellow-300'
              }`}>
                <h2 className="text-2xl font-bold mb-2">
                  {diagnostics.overall}
                </h2>
                {diagnostics.summary && (
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-700">✅ {diagnostics.summary.passed} Passed</span>
                    <span className="text-red-700">❌ {diagnostics.summary.failed} Failed</span>
                    <span className="text-red-900">🔥 {diagnostics.summary.errors} Errors</span>
                    <span className="text-gray-600">⏭️ {diagnostics.summary.skipped} Skipped</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Run at: {diagnostics.timestamp}
                </p>
              </div>

              {/* Individual Test Results */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Test Results</h3>
                {diagnostics.results?.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-2">
                          {getStatusIcon(result.status)} {result.test}
                        </h4>
                        
                        {result.details && (
                          <div className="bg-white bg-opacity-50 rounded p-3 mb-2">
                            <pre className="text-xs overflow-x-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {result.error && (
                          <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                            <p className="text-sm font-semibold text-red-900">Error:</p>
                            <p className="text-sm text-red-800">{result.error}</p>
                            {result.stack && (
                              <details className="mt-2">
                                <summary className="text-xs cursor-pointer text-red-700">
                                  View Stack Trace
                                </summary>
                                <pre className="text-xs mt-1 text-red-600 overflow-x-auto">
                                  {result.stack}
                                </pre>
                              </details>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className={`ml-4 px-3 py-1 rounded-full text-sm font-bold ${
                        result.status === 'PASS' ? 'bg-green-200' :
                        result.status === 'FAIL' ? 'bg-red-200' :
                        result.status === 'ERROR' ? 'bg-red-300' :
                        'bg-gray-200'
                      }`}>
                        {result.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interpretation Guide */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mt-8">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  📖 What These Results Mean
                </h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li><strong>Environment Variables:</strong> Checks if RESEND_API_KEY is set</li>
                  <li><strong>Resend Client:</strong> Verifies the Resend API client initializes</li>
                  <li><strong>Database Connection:</strong> Tests Supabase connectivity</li>
                  <li><strong>Single Email Send:</strong> Sends one test email to verify basic functionality</li>
                  <li><strong>Batch Send:</strong> Tests sending 2 emails in batch (like your 647-email campaign)</li>
                  <li><strong>Subscriber Count:</strong> Checks database query functionality</li>
                </ul>
              </div>

              {/* Action Items */}
              {diagnostics.results?.some(r => r.status === 'FAIL' || r.status === 'ERROR') && (
                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-orange-900 mb-3">
                    🔧 Recommended Actions
                  </h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-orange-800">
                    {diagnostics.results.find(r => r.test === 'Environment Variables' && r.status !== 'PASS') && (
                      <li>Set RESEND_API_KEY in your environment variables</li>
                    )}
                    {diagnostics.results.find(r => r.test === 'Resend Client' && r.status !== 'PASS') && (
                      <li>Check that your Resend API key is valid</li>
                    )}
                    {diagnostics.results.find(r => r.test === 'Single Email Send' && r.status !== 'PASS') && (
                      <li>Verify domain (aiinbusinesssociety.org) is verified in Resend dashboard</li>
                    )}
                    {diagnostics.results.find(r => r.test === 'Batch Send' && r.status !== 'PASS') && (
                      <li><strong>This is likely your issue!</strong> Check the error details above for batch sending</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!diagnostics && !loading && (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg">Click "Run Diagnostics" to test your email system</p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-6 flex gap-4 justify-center">
          <a
            href="/admin"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            ← Back to Admin
          </a>
          <a
            href="https://resend.com/emails"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Open Resend Dashboard →
          </a>
        </div>
      </div>
    </div>
  );
}

