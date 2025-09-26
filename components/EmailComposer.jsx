"use client";
import { useState, useEffect } from "react";

export default function EmailComposer({ initialData = {} }) {
  const [audiences, setAudiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    subject: initialData.subject || "",
    content: initialData.content || "",
    audienceIds: [],
    fromName: "AI in Business Society",
    testMode: true
  });
  const [results, setResults] = useState(null);

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData.subject || initialData.content) {
      setFormData(prev => ({
        ...prev,
        subject: initialData.subject || prev.subject,
        content: initialData.content || prev.content
      }));
    }
  }, [initialData]);

  useEffect(() => {
    fetchAudiences();
  }, []);

  const fetchAudiences = async () => {
    try {
      const response = await fetch('/api/admin/send-email');
      if (response.ok) {
        const data = await response.json();
        setAudiences(data.audiences);
      }
    } catch (error) {
      console.error('Error fetching audiences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAudienceToggle = (audienceId) => {
    setFormData(prev => ({
      ...prev,
      audienceIds: prev.audienceIds.includes(audienceId)
        ? prev.audienceIds.filter(id => id !== audienceId)
        : [...prev.audienceIds, audienceId]
    }));
  };

  const handleSelectAll = () => {
    setFormData(prev => ({
      ...prev,
      audienceIds: prev.audienceIds.length === audiences.length 
        ? [] 
        : audiences.map(a => a.id)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.audienceIds.length === 0) {
      alert('Please select at least one audience');
      return;
    }

    if (!formData.subject.trim() || !formData.content.trim()) {
      alert('Please provide both subject and content');
      return;
    }

    setSending(true);
    setResults(null);

    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
        if (data.summary.errors === 0) {
          // Reset form on success
          setFormData(prev => ({
            ...prev,
            subject: "",
            content: "",
            audienceIds: []
          }));
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Failed to send email: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading audiences...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-[color:var(--byu-blue)] mb-6">Send Email Campaign</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* From Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Name
          </label>
          <input
            type="text"
            value={formData.fromName}
            onChange={(e) => setFormData(prev => ({ ...prev, fromName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
            placeholder="AI in Business Society"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subject Line
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
            placeholder="Enter email subject..."
            required
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Content (HTML supported)
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
            placeholder="Enter your email content here. You can use HTML tags for formatting..."
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Tip: Use HTML tags like &lt;p&gt;, &lt;h2&gt;, &lt;strong&gt;, &lt;a href=""&gt; for formatting
          </p>
        </div>

        {/* Test Mode Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="testMode"
            checked={formData.testMode}
            onChange={(e) => setFormData(prev => ({ ...prev, testMode: e.target.checked }))}
            className="h-4 w-4 text-[color:var(--byu-blue)] border-gray-300 rounded focus:ring-[color:var(--byu-blue)]"
          />
          <label htmlFor="testMode" className="text-sm text-gray-700">
            Test Mode (sends to max 5 people per audience for testing)
          </label>
        </div>

        {/* Audience Selection */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Audiences
            </label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-[color:var(--byu-blue)] hover:underline"
            >
              {formData.audienceIds.length === audiences.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-gray-200 rounded-md">
            {audiences.map((audience) => (
              <label key={audience.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.audienceIds.includes(audience.id)}
                  onChange={() => handleAudienceToggle(audience.id)}
                  className="h-4 w-4 text-[color:var(--byu-blue)] border-gray-300 rounded focus:ring-[color:var(--byu-blue)]"
                />
                <span className="text-sm">
                  <strong>{audience.name}</strong> 
                  <span className="text-gray-500"> ({audience.subscriberCount} subscribers)</span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Selected: {formData.audienceIds.length} audience{formData.audienceIds.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-2 bg-[color:var(--byu-blue)] text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : (formData.testMode ? 'Send Test Email' : 'Send Email')}
          </button>
          
          {!formData.testMode && (
            <div className="flex items-center text-orange-600 text-sm">
              <span className="inline-block w-4 h-4 bg-orange-600 rounded-full mr-2"></span>
              Production mode - will send to all subscribers!
            </div>
          )}
        </div>
      </form>

      {/* Results */}
      {results && (
        <div className="mt-8 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-semibold mb-3">
            Email Send Results {results.summary.testMode && "(TEST MODE)"}
          </h3>
          
          <div className="mb-4">
            <p><strong>Total audiences:</strong> {results.summary.total}</p>
            <p className="text-green-600"><strong>Successful:</strong> {results.summary.successful}</p>
            <p className="text-red-600"><strong>Errors:</strong> {results.summary.errors}</p>
          </div>

          <div className="space-y-2">
            {results.results.map((result, index) => (
              <div key={index} className={`p-2 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
                <p><strong>{result.audienceName}</strong></p>
                {result.success ? (
                  <p className="text-green-700 text-sm">
                    Sent successfully
                    {result.testMode && ` (${result.recipientCount} test recipients)`}
                  </p>
                ) : (
                  <p className="text-red-700 text-sm">Error: {result.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}