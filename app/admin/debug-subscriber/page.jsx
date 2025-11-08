"use client";
import { useState } from "react";

export default function DebugSubscriberPage() {
  const [email, setEmail] = useState("deanbean@student.byu.edu");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function checkSubscriber() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`/api/debug-subscriber?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch');
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Debug Subscriber</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium mb-2">
            Email Address
          </label>
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded border p-2"
              placeholder="Enter email to check"
            />
            <button
              onClick={checkSubscriber}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">Error:</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && !result.found && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-semibold">❌ Not Found</p>
            <p className="text-yellow-700">
              The email <strong>{result.email}</strong> is not in the database.
            </p>
          </div>
        )}

        {result && result.found && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold">✅ Found</p>
              <p className="text-green-700">
                The email <strong>{result.email}</strong> has <strong>{result.subscriptionCount}</strong> subscription(s)
              </p>
            </div>

            {/* Current Subscriptions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Current Subscriptions</h2>
              <div className="space-y-3">
                {result.subscriptions.map((sub, index) => (
                  <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-4">
                    <p className="font-semibold text-lg">{sub.audienceName}</p>
                    <p className="text-sm text-gray-600">Audience ID: {sub.audienceId}</p>
                    {sub.major && <p className="text-sm">Major: {sub.major}</p>}
                    <p className="text-sm">Type: {sub.isStudent ? 'Student' : 'Teacher/Faculty'}</p>
                    <p className="text-sm text-gray-500">
                      Subscribed: {new Date(sub.subscribedAt).toLocaleString()}
                    </p>
                    {sub.otherInterests && (
                      <p className="text-sm mt-2">
                        <span className="font-medium">Other interests:</span> {sub.otherInterests}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Greg Michaelsen / Event Audiences */}
            {result.gregMichaelsenAudiences && result.gregMichaelsenAudiences.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">
                  🎯 Greg Michaelsen / Event Audiences
                </h2>
                <div className="space-y-2">
                  {result.gregMichaelsenAudiences.map((aud, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded ${
                        aud.isSubscribed
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <p className="font-semibold">
                        {aud.isSubscribed ? '✅ SUBSCRIBED' : '❌ NOT SUBSCRIBED'}
                      </p>
                      <p>{aud.audienceName} (ID: {aud.audienceId})</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Audiences */}
            <details className="bg-white rounded-lg shadow p-6">
              <summary className="text-xl font-semibold cursor-pointer">
                All Audiences ({result.allAudiences?.length || 0})
              </summary>
              <div className="mt-4 space-y-1 max-h-96 overflow-y-auto">
                {result.allAudiences?.map((aud, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm ${
                      aud.isSubscribed ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    {aud.isSubscribed ? '✅' : '❌'} {aud.name} (ID: {aud.id})
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}





