"use client";
import { useState } from "react";

export default function DiagnosticPage() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/diagnostic-resend');
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setResults({
        overall: 'ERROR',
        error: error.message,
        tests: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS': return 'bg-green-100 border-green-500 text-green-800';
      case 'FAIL': return 'bg-red-100 border-red-500 text-red-800';
      case 'INFO': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASS': return '✅';
      case 'FAIL': return '❌';
      case 'INFO': return 'ℹ️';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-[color:var(--byu-blue)] mb-4">
            🔍 Resend Email Diagnostics
          </h1>
          <p className="text-gray-600 mb-6">
            This diagnostic tool will test your Resend configuration and identify any issues preventing emails from being sent.
          </p>

          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="px-6 py-3 bg-[color:var(--byu-blue)] text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? '🔄 Running Diagnostics...' : '▶️ Run Diagnostics'}
          </button>

          {loading && (
            <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-blue-800 font-medium">Running diagnostic tests...</span>
              </div>
            </div>
          )}

          {results && (
            <div className="mt-8 space-y-6">
              {/* Overall Status */}
              <div className={`p-6 rounded-lg border-2 ${
                results.overall === 'PASS' 
                  ? 'bg-green-50 border-green-500' 
                  : results.overall === 'FAIL'
                  ? 'bg-red-50 border-red-500'
                  : 'bg-yellow-50 border-yellow-500'
              }`}>
                <h2 className="text-2xl font-bold mb-2">
                  {results.overall === 'PASS' ? '✅ All Tests Passed!' : '❌ Issues Found'}
                </h2>
                {results.summary && (
                  <p className="text-lg">
                    {results.summary.passed} passed, {results.summary.failed} failed, {results.summary.info} info
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  Timestamp: {results.timestamp}
                </p>
              </div>

              {/* Individual Tests */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800">Test Results:</h3>
                {results.tests.map((test, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${getStatusColor(test.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg flex items-center gap-2">
                          <span>{getStatusIcon(test.status)}</span>
                          {test.name}
                        </h4>
                        <p className="mt-2">{test.message}</p>
                        
                        {test.fix && (
                          <div className="mt-3 p-3 bg-white rounded border border-gray-300">
                            <p className="text-sm font-semibold text-gray-700">🔧 Fix:</p>
                            <p className="text-sm text-gray-600">{test.fix}</p>
                          </div>
                        )}

                        {test.note && (
                          <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm text-blue-800">{test.note}</p>
                          </div>
                        )}

                        {test.emailId && (
                          <p className="mt-2 text-sm text-gray-600">
                            Email ID: <code className="bg-gray-100 px-2 py-1 rounded">{test.emailId}</code>
                          </p>
                        )}

                        {test.data && test.status === 'PASS' && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                              Show response data
                            </summary>
                            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                              {JSON.stringify(test.data, null, 2)}
                            </pre>
                          </details>
                        )}

                        {test.error && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
                              Show error details
                            </summary>
                            <pre className="mt-2 p-3 bg-red-50 rounded text-xs overflow-auto max-h-40">
                              {typeof test.error === 'string' ? test.error : JSON.stringify(test.error, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Items */}
              {results.overall === 'FAIL' && (
                <div className="mt-6 p-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                  <h3 className="text-xl font-bold text-yellow-800 mb-3">🚨 Action Required</h3>
                  <ul className="list-disc list-inside space-y-2 text-yellow-800">
                    {results.tests
                      .filter(t => t.status === 'FAIL')
                      .map((test, idx) => (
                        <li key={idx}>
                          <strong>{test.name}:</strong> {test.fix || test.message}
                        </li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Next Steps */}
              <div className="mt-6 p-6 bg-gray-100 rounded-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-3">📋 Next Steps</h3>
                {results.overall === 'PASS' ? (
                  <div className="space-y-2 text-gray-700">
                    <p>✅ Your Resend configuration is working correctly!</p>
                    <p>If batch sends are still failing with 647 emails, the issue might be:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Resend plan limits (check your plan's email quota)</li>
                      <li>Rate limiting at scale (try sending smaller batches)</li>
                      <li>Timeout issues (function execution time limit)</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-2 text-gray-700">
                    <p>Follow the fixes shown above for failed tests.</p>
                    <p>Common solutions:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Check RESEND_API_KEY in environment variables</li>
                      <li>Verify domain at <a href="https://resend.com/domains" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">resend.com/domains</a></li>
                      <li>Check API key permissions in Resend dashboard</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

