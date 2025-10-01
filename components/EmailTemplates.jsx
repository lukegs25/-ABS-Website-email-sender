"use client";
import { useEffect, useState } from "react";

const EMAIL_TEMPLATES = {
  event_announcement: {
    name: "Event Announcement",
    subject: "Upcoming ABS Event: [EVENT_NAME]",
    content: `
<h2>You're Invited: [EVENT_NAME]</h2>

<p>Join us for an exciting AI in Business Society event!</p>

<p><strong>📅 Date:</strong> [EVENT_DATE]</p>
<p><strong>🕐 Time:</strong> [EVENT_TIME]</p>  
<p><strong>📍 Location:</strong> [EVENT_LOCATION]</p>

<h3>What to Expect:</h3>
<p>[EVENT_DESCRIPTION]</p>

<p><strong>Who Should Attend:</strong> [TARGET_AUDIENCE]</p>

<p>
  <a href="[REGISTRATION_LINK]" style="background-color: #002e5d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
    Register Now
  </a>
</p>

<p>Questions? Reply to this email or contact us.</p>

<p>See you there!<br>
The ABS Team</p>
    `.trim()
  },
  newsletter: {
    name: "Newsletter",
    subject: "ABS Newsletter - [MONTH] [YEAR]",
    content: `
<h2>AI in Business Society Newsletter</h2>
<h3>[MONTH] [YEAR] Edition</h3>

<h3>🎯 This Month's Highlights</h3>
<ul>
  <li>[HIGHLIGHT_1]</li>
  <li>[HIGHLIGHT_2]</li>
  <li>[HIGHLIGHT_3]</li>
</ul>

<h3>📚 AI Industry News</h3>
<p>[INDUSTRY_NEWS_1]</p>
<p>[INDUSTRY_NEWS_2]</p>

<h3>💼 Upcoming Events</h3>
<ul>
  <li><strong>[EVENT_1_DATE]:</strong> [EVENT_1_NAME] - [EVENT_1_DESCRIPTION]</li>
  <li><strong>[EVENT_2_DATE]:</strong> [EVENT_2_NAME] - [EVENT_2_DESCRIPTION]</li>
</ul>

<h3>🎓 Member Spotlight</h3>
<p>[MEMBER_SPOTLIGHT]</p>

<h3>📝 Opportunities</h3>
<p>[OPPORTUNITIES]</p>

<p>
  <a href="https://calendar.google.com/calendar/embed?src=c240123c3faa5646577759508b44ade28fc0856486fa89ce91a7e69824214aef%40group.calendar.google.com&ctz=America%2FDenver" style="background-color: #002e5d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
    View Full Calendar
  </a>
</p>
    `.trim()
  },
  welcome: {
    name: "Welcome Email",
    subject: "Welcome to AI in Business Society!",
    content: `
<h2>Welcome to the AI in Business Society! 🎉</h2>

<p>Thank you for joining our community of AI enthusiasts, business students, and industry professionals!</p>

<h3>What You Can Expect:</h3>
<ul>
  <li><strong>🎯 Exclusive Events:</strong> Workshops, guest speakers, networking opportunities</li>
  <li><strong>📰 Industry Updates:</strong> Latest AI trends and business applications</li>
  <li><strong>🤝 Community:</strong> Connect with like-minded students and professionals</li>
  <li><strong>💼 Career Opportunities:</strong> Job postings, internships, and career guidance</li>
</ul>

<h3>Get Connected:</h3>
<p>
  <a href="https://calendar.google.com/calendar/embed?src=c240123c3faa5646577759508b44ade28fc0856486fa89ce91a7e69824214aef%40group.calendar.google.com&ctz=America%2FDenver" style="color: #002e5d; text-decoration: underline;">
    📅 Add our calendar to stay updated
  </a>
</p>
<p>
  <a href="https://clubs.byu.edu/p/clubview/18295873491185562" style="color: #002e5d; text-decoration: underline;">
    🏫 Visit our BYU club page
  </a>
</p>

<h3>Quick Start:</h3>
<ol>
  <li>Mark your calendar for our upcoming events</li>
  <li>Follow us for updates and announcements</li>
  <li>Engage with our community</li>
</ol>

<p>We're excited to have you on board! If you have any questions, don't hesitate to reach out.</p>

<p>Best regards,<br>
The AI in Business Society Team</p>
    `.trim()
  },
  meeting_reminder: {
    name: "Meeting Reminder",
    subject: "Reminder: [MEETING_NAME] Tomorrow",
    content: `
<h2>Reminder: [MEETING_NAME]</h2>

<p>This is a friendly reminder about our upcoming meeting tomorrow!</p>

<div style="background-color: #f0f8ff; padding: 15px; border-left: 4px solid #002e5d; margin: 20px 0;">
  <p><strong>📅 Date:</strong> [MEETING_DATE]</p>
  <p><strong>🕐 Time:</strong> [MEETING_TIME]</p>
  <p><strong>📍 Location:</strong> [MEETING_LOCATION]</p>
  <p><strong>🔗 Zoom Link:</strong> <a href="[ZOOM_LINK]" style="color: #002e5d;">[ZOOM_LINK]</a></p>
</div>

<h3>📋 Agenda:</h3>
<ul>
  <li>[AGENDA_ITEM_1]</li>
  <li>[AGENDA_ITEM_2]</li>
  <li>[AGENDA_ITEM_3]</li>
</ul>

<h3>📝 What to Bring:</h3>
<p>[WHAT_TO_BRING]</p>

<p>Can't make it? Please let us know by replying to this email.</p>

<p>Looking forward to seeing you there!</p>
    `.trim()
  }
};

export default function EmailTemplates({ onUseTemplate }) {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customFields, setCustomFields] = useState({});
  const [niche, setNiche] = useState("");
  const [loadingNews, setLoadingNews] = useState(false);
  const [useAiNews, setUseAiNews] = useState(false);
  const [refine, setRefine] = useState("");
  const [previewNews, setPreviewNews] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [audiences, setAudiences] = useState([]);
  const [loadingAudiences, setLoadingAudiences] = useState(false);
  const [selectedAudienceId, setSelectedAudienceId] = useState("");

  const handleTemplateSelect = (templateKey) => {
    setSelectedTemplate(templateKey);
    // Extract placeholders from template content and subject
    const template = EMAIL_TEMPLATES[templateKey];
    const placeholders = new Set();
    const text = template.subject + " " + template.content;
    const matches = text.match(/\[([^\]]+)\]/g);
    
    if (matches) {
      matches.forEach(match => {
        const field = match.slice(1, -1);
        placeholders.add(field);
      });
    }

    // Initialize custom fields
    const fields = {};
    placeholders.forEach(field => {
      fields[field] = "";
    });
    setCustomFields(fields);
  };

  const handleFieldChange = (field, value) => {
    setCustomFields(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyTemplate = () => {
    if (!selectedTemplate) return;

    const template = EMAIL_TEMPLATES[selectedTemplate];
    let subject = template.subject;
    let content = template.content;

    // Replace placeholders with custom field values
    Object.entries(customFields).forEach(([field, value]) => {
      const placeholder = `[${field}]`;
      subject = subject.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
      content = content.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    });

    // Append optional Additional Info block if provided
    if (additionalInfo && additionalInfo.trim()) {
      const extra = `\n\n<h3>Additional Info</h3>\n<p>${additionalInfo.trim().replace(/\n/g, '<br/>')}</p>`;
      content += extra;
    }

    onUseTemplate({ subject, content });
    
    // Reset state
    setSelectedTemplate("");
    setCustomFields({});
    setAdditionalInfo("");
  };

  async function fetchAudiences() {
    try {
      setLoadingAudiences(true);
      const res = await fetch('/api/admin/audiences');
      const data = await res.json();
      if (res.ok && Array.isArray(data.audiences)) {
        setAudiences(data.audiences);
      } else {
        setAudiences([]);
      }
    } catch {
      setAudiences([]);
    } finally {
      setLoadingAudiences(false);
    }
  }

  useEffect(() => {
    if (useAiNews && audiences.length === 0 && !loadingAudiences) {
      fetchAudiences();
    }
  }, [useAiNews]);

  async function insertAiNews() {
    setLoadingNews(true);
    try {
      // Determine topic from selected audience, with fallback to general AI
      const chosen = audiences.find(a => String(a.id) === String(selectedAudienceId));
      let topic = "";
      if (chosen) {
        const lower = (chosen.name || "").toLowerCase();
        topic = (lower.includes("etc") || lower.includes("general")) ? "general AI" : chosen.name;
      } else if (niche) {
        topic = niche;
      } else {
        topic = "general AI";
      }
      const res = await fetch('/api/ai-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche: topic, refine })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to fetch AI news');
        return;
      }
      const newsBlock = `\n\n<h3>📰 ${topic} - Latest AI News</h3>\n${data.content.replace(/\n/g, '<br/>')}\n`;
      setPreviewNews(newsBlock);
      // Try to fill NEWS placeholders if they exist, otherwise append
      const hasNewsPlaceholders = Object.keys(customFields).some(k => k.includes('NEWS'));
      if (hasNewsPlaceholders) {
        const firstNewsKey = Object.keys(customFields).find(k => k.includes('NEWS'));
        setCustomFields(prev => ({ ...prev, [firstNewsKey]: data.content }));
      } else {
        // Hold in preview; user can insert
      }
    } catch (e) {
      alert('Unexpected error fetching AI news');
    } finally {
      setLoadingNews(false);
    }
  }

  function applyPreviewToTemplate() {
    if (!selectedTemplate || !previewNews) return;
    onUseTemplate({
      subject: EMAIL_TEMPLATES[selectedTemplate]?.subject || '',
      content: (EMAIL_TEMPLATES[selectedTemplate]?.content || '') + previewNews
    });
    setPreviewNews("");
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-[color:var(--byu-blue)] mb-4">Email Templates</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose a template to get started:
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => handleTemplateSelect(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
          >
            <option value="">Select a template...</option>
            {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => (
              <option key={key} value={key}>{template.name}</option>
            ))}
          </select>
        </div>

        {selectedTemplate && (
          <div className="space-y-4">
            {/* Toggle AI News, audience selector, refine, and actions */}
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={useAiNews} onChange={(e) => setUseAiNews(e.target.checked)} />
                <span className="text-lg font-semibold text-[color:var(--byu-blue)]">Include AI News</span>
              </label>
              {useAiNews && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select audience</label>
                    <select
                      value={selectedAudienceId}
                      onChange={(e) => setSelectedAudienceId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
                    >
                      <option value="">Choose an audience...</option>
                      {audiences.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                    {loadingAudiences && (
                      <p className="text-xs text-gray-500 mt-1">Loading audiences…</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Optional refine prompt</label>
                    <input
                      type="text"
                      value={refine}
                      onChange={(e) => setRefine(e.target.value)}
                      placeholder="e.g., focus on regulation, or model releases"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
                    />
                  </div>
                  <div className="sm:col-span-2 flex gap-3">
                    <button
                      type="button"
                      onClick={insertAiNews}
                      disabled={loadingNews}
                      className="px-4 py-2 bg-[color:var(--byu-blue)] text-white rounded-md hover:opacity-90 disabled:opacity-60"
                    >
                      {loadingNews ? 'Fetching...' : (previewNews ? 'Regenerate News' : 'Generate News')}
                    </button>
                    {previewNews && (
                      <button
                        type="button"
                        onClick={applyPreviewToTemplate}
                        className="px-4 py-2 border border-[color:var(--byu-blue)] text-[color:var(--byu-blue)] rounded-md hover:bg-[color:var(--byu-blue)]/10"
                      >
                        Insert Preview into Template
                      </button>
                    )}
                  </div>
                  {previewNews && (
                    <div className="sm:col-span-2 bg-gray-50 p-3 rounded-md text-sm" dangerouslySetInnerHTML={{ __html: previewNews }} />
                  )}
                </div>
              )}
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium mb-2">Template Preview:</h4>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Subject:</strong> {EMAIL_TEMPLATES[selectedTemplate].subject}
              </p>
              <div className="text-sm text-gray-600 max-h-40 overflow-y-auto bg-white p-2 rounded">
                {EMAIL_TEMPLATES[selectedTemplate].content.split('\n').map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>

            {Object.keys(customFields).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Fill in the details:</h4>
                <div className="space-y-3">
                  {Object.keys(customFields).map(field => (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}:
                      </label>
                      {field.includes('DESCRIPTION') || field.includes('NEWS') || field.includes('OPPORTUNITIES') || field.includes('SPOTLIGHT') ? (
                        <textarea
                          value={customFields[field]}
                          onChange={(e) => handleFieldChange(field, e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
                          placeholder={`Enter ${field.toLowerCase().replace(/_/g, ' ')}...`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={customFields[field]}
                          onChange={(e) => handleFieldChange(field, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
                          placeholder={`Enter ${field.toLowerCase().replace(/_/g, ' ')}...`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Additional Info box */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Info (optional)</label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
                placeholder="Add extra notes, links, reminders, etc."
              />
            </div>

            <button
              onClick={applyTemplate}
              className="w-full px-4 py-2 bg-[color:var(--byu-blue)] text-white rounded-md hover:opacity-90"
            >
              Use This Template
            </button>
          </div>
        )}
      </div>
    </div>
  );
}