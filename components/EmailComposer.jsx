"use client";
import { useState, useEffect } from "react";
import { useAdmin } from "./AdminAuth";
import { AttachmentUpload } from "./ui/attachment-upload";

export default function EmailComposer({ initialData = {} }) {
  const adminSession = useAdmin();
  const [audiences, setAudiences] = useState([]);
  const [filteredAudiences, setFilteredAudiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    subject: initialData.subject || "",
    content: initialData.content || "",
    audienceIds: [],
    fromName: "AI in Business Society"
  });
  const [attachments, setAttachments] = useState([]);
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

  // Filter audiences based on admin permissions
  useEffect(() => {
    if (!adminSession || audiences.length === 0) {
      setFilteredAudiences([]);
      return;
    }

    if (adminSession.isSuperAdmin) {
      // Super admins can see all audiences
      setFilteredAudiences(audiences);
    } else {
      // Regular admins can only see audiences that match their adminTypes
      const allowedAudiences = audiences.filter(audience => {
        return adminSession.adminTypes.some(adminType => 
          audience.name.toLowerCase().includes(adminType.toLowerCase())
        );
      });
      setFilteredAudiences(allowedAudiences);
      
      // Clear any selected audiences that are no longer available
      const allowedIds = allowedAudiences.map(a => a.id);
      setFormData(prev => ({
        ...prev,
        audienceIds: prev.audienceIds.filter(id => allowedIds.includes(id))
      }));
    }
  }, [audiences, adminSession]);

  const fetchAudiences = async () => {
    try {
      const response = await fetch('/api/admin/send-email');
      const data = await response.json();
      if (response.ok) {
        if (data && data.audiences !== undefined) {
          setAudiences(data.audiences || []);
        } else {
          setAudiences([]);
        }
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
      audienceIds: prev.audienceIds.length === filteredAudiences.length 
        ? [] 
        : filteredAudiences.map(a => a.id)
    }));
  };

  // CSV Export Functions
  const downloadCSV = (emails, audienceName) => {
    const csv = emails.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${audienceName.replace(/[^a-z0-9]/gi, '_')}_recipients.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadAllCSV = () => {
    const allEmails = results.results
      .filter(r => r.emailsSent)
      .flatMap(r => r.emailsSent.map(email => ({
        audience: r.audienceName,
        email: email
      })));
    
    const csv = 'Audience,Email\n' + 
      allEmails.map(item => `"${item.audience}","${item.email}"`).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_recipients.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Copy to clipboard function
  const copyToClipboard = (emails) => {
    const text = emails.join('\n');
    navigator.clipboard.writeText(text).then(() => {
      alert('Emails copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
  };

  // Calculate unique email count
  const getUniqueEmailCount = () => {
    if (!results) return 0;
    const allEmails = results.results
      .filter(r => r.emailsSent)
      .flatMap(r => r.emailsSent);
    return new Set(allEmails).size;
  };

  const convertFilesToBase64 = async (files) => {
    const promises = files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1]; // Remove data URL prefix
          resolve({
            filename: file.name,
            content: base64,
            type: file.type
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    return Promise.all(promises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.audienceIds.length === 0) {
      alert('Please select at least one audience');
      return;
    }

    // Validate that all selected audiences are in the filtered list (security check)
    const allowedAudienceIds = filteredAudiences.map(a => a.id);
    const invalidSelections = formData.audienceIds.filter(id => !allowedAudienceIds.includes(id));
    if (invalidSelections.length > 0) {
      alert('You do not have permission to send to some of the selected audiences. Please refresh and try again.');
      return;
    }

    if (!formData.subject.trim() || !formData.content.trim()) {
      alert('Please provide both subject and content');
      return;
    }

    setSending(true);
    setResults(null);

    try {
      // Convert attachments to base64
      const attachmentData = attachments.length > 0 
        ? await convertFilesToBase64(attachments)
        : [];

      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          attachments: attachmentData
        }),
      });

      // Try to parse as JSON, but handle non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Response is not JSON (likely an error page or redirect)
        const text = await response.text();
        console.error('Non-JSON response:', text);
        console.error('Response status:', response.status);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Show first 200 chars of the error
        const preview = text.substring(0, 200);
        throw new Error(`Server error (${response.status}): ${preview}...`);
      }
      
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
          setAttachments([]);
        }
      } else {
        alert(`Error: ${data.error || data.details || 'Unknown error'}`);
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
            <span className="text-xs font-normal text-gray-500 ml-2">
              ✏️ Editable
            </span>
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
            <span className="text-xs font-normal text-gray-500 ml-2">
              ✏️ Fully editable - edit the template content below as needed
            </span>
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)] font-mono text-sm"
            placeholder="Enter your email content here. You can use HTML tags for formatting..."
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            💡 <strong>Tips:</strong> You can manually edit any template content above. Use HTML tags like &lt;p&gt;, &lt;h2&gt;, &lt;strong&gt;, &lt;a href=""&gt; for formatting. 
            Look for <span className="font-semibold">(Fill in: ...)</span> placeholders and replace them with your content.
          </p>
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments (Optional)
          </label>
          <AttachmentUpload 
            files={attachments}
            onChange={setAttachments}
          />
        </div>

        {/* Audience Selection */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Audiences
              {adminSession && !adminSession.isSuperAdmin && (
                <span className="ml-2 text-xs text-gray-500 font-normal">
                  (Showing only your assigned audiences)
                </span>
              )}
            </label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-[color:var(--byu-blue)] hover:underline"
            >
              {formData.audienceIds.length === filteredAudiences.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-gray-200 rounded-md">
            {filteredAudiences.map((audience) => (
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
            {filteredAudiences.length === 0 && !loading && (
              <div className="col-span-2 text-center text-gray-500 py-4">
                {adminSession && !adminSession.isSuperAdmin 
                  ? "No audiences available for your admin type." 
                  : "No audiences available."
                }
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Selected: {formData.audienceIds.length} audience{formData.audienceIds.length !== 1 ? 's' : ''} out of {filteredAudiences.length} available
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-2 bg-[color:var(--byu-blue)] text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </form>

      {/* Results */}
      {results && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border-2 border-green-200">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-bold text-green-700">
              Email Send Results
            </h3>
            {results.results.some(r => r.emailsSent && r.emailsSent.length > 0) && (
              <button
                onClick={downloadAllCSV}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
              >
                Export All to CSV
              </button>
            )}
          </div>
          
          <div className="mb-6 p-4 bg-white rounded-md shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Audiences</p>
                <p className="text-2xl font-bold text-gray-800">{results.summary.total}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">{results.summary.successful}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{results.summary.errors}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Unique Recipients</p>
                <p className="text-2xl font-bold text-blue-600">{getUniqueEmailCount()}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {results.results.map((result, index) => (
              <div 
                key={index} 
                className={`rounded-lg border-2 overflow-hidden ${
                  result.success ? 'border-green-300 bg-white' : 'border-red-300 bg-red-50'
                }`}
              >
                <div className={`p-4 ${result.success ? 'bg-green-50' : 'bg-red-100'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-800">
                        {result.audienceName}
                      </h4>
                      {result.success ? (
                        <div className="mt-1 space-y-1">
                          <p className="text-green-700 font-medium">
                            Sent successfully to {result.emailsSent?.length || result.recipientCount || 0} recipients
                          </p>
                          {result.testMode && (
                            <p className="text-sm text-orange-600 font-medium">
                              TEST MODE - Sample recipients only
                            </p>
                          )}
                          {result.sentCount !== undefined && result.errorCount > 0 && (
                            <p className="text-sm text-yellow-600">
                              {result.sentCount} sent, {result.errorCount} failed
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-red-700 mt-1">Error: {result.error}</p>
                      )}
                    </div>
                    
                    {result.success && result.emailsSent && result.emailsSent.length > 0 && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => copyToClipboard(result.emailsSent)}
                          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                          title="Copy emails to clipboard"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => downloadCSV(result.emailsSent, result.audienceName)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Export CSV
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {result.success && result.emailsSent && result.emailsSent.length > 0 && (
                  <details className="group">
                    <summary className="cursor-pointer p-3 bg-gray-100 hover:bg-gray-200 transition-colors">
                      <span className="font-medium text-gray-700">
                        Show all {result.emailsSent.length} email addresses
                      </span>
                      <span className="ml-2 text-gray-500 text-sm">
                        (click to expand)
                      </span>
                    </summary>
                    <div className="p-4 bg-white max-h-96 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {result.emailsSent.map((email, emailIndex) => (
                          <div 
                            key={emailIndex}
                            className="p-2 bg-gray-50 rounded text-sm font-mono text-gray-700 border border-gray-200"
                          >
                            {email}
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}