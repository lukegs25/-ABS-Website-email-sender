"use client";

import { useState, useEffect, useCallback } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDisplayDate(event) {
  const start = event.start?.dateTime || event.start?.date;
  if (!start) return "TBD";
  const d = new Date(start);
  return d.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
    timeZone: "America/Denver",
  });
}

function formatDisplayTime(event) {
  if (!event.start?.dateTime) return "All Day";
  const d = new Date(event.start.dateTime);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", timeZone: "America/Denver",
  });
}

function eventDateISO(event) {
  const start = event.start?.dateTime || event.start?.date;
  if (!start) return null;
  return new Date(start).toISOString().slice(0, 10);
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEPS = [
  { id: "speaker", label: "Speaker Lookup" },
  { id: "flyer",   label: "Flyer Generation" },
  { id: "captions", label: "Captions & Template" },
];

function StepIndicator({ currentStep, completedSteps }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((step, i) => {
        const done = completedSteps.includes(step.id);
        const active = currentStep === step.id;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full transition-colors ${
              done    ? "bg-green-100 text-green-700" :
              active  ? "bg-blue-100 text-[color:var(--byu-blue)]" :
                        "bg-gray-100 text-gray-400"
            }`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                done ? "bg-green-500 text-white" : active ? "bg-[color:var(--byu-blue)] text-white" : "bg-gray-300 text-white"
              }`}>
                {done ? "✓" : i + 1}
              </span>
              {step.label}
              {active && <span className="animate-pulse">…</span>}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-6 ${done ? "bg-green-300" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}

// ── Caption card ──────────────────────────────────────────────────────────────

function CaptionCard({ label, icon, value, onChange }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          {icon} {label}
        </span>
        <CopyButton text={value} />
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={4}
        className="w-full text-sm text-gray-800 border border-gray-100 rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-300"
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MarketingAgentTab() {
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [speakerName, setSpeakerName] = useState("");

  // Generation state
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [error, setError] = useState(null);

  // Results
  const [campaignId, setCampaignId] = useState(null);
  const [speakerInfo, setSpeakerInfo] = useState(null);
  const [flyerBase64, setFlyerBase64] = useState(null);
  const [flyerMimeType, setFlyerMimeType] = useState("image/png");
  const [palette, setPalette] = useState(null);
  const [instagramCaption, setInstagramCaption] = useState("");
  const [linkedinCaption, setLinkedinCaption] = useState("");
  const [byuSubject, setByuSubject] = useState("");
  const [byuTemplate, setByuTemplate] = useState("");

  // Post state
  const [posting, setPosting] = useState({ instagram: false, linkedin: false });
  const [posted, setPosted] = useState({ instagram: false, linkedin: false });
  const [scheduling, setScheduling] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [postError, setPostError] = useState(null);

  // Load upcoming events (30 day window)
  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await fetch("/api/admin/calendar/events?days=30", { credentials: "include" });
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  function completeStep(id) {
    setCompletedSteps(prev => [...prev, id]);
    setCurrentStep(null);
  }

  async function runAgent() {
    if (!selectedEvent) return;
    setRunning(true);
    setError(null);
    setCompletedSteps([]);
    setCampaignId(null);
    setSpeakerInfo(null);
    setFlyerBase64(null);
    setPalette(null);
    setInstagramCaption("");
    setLinkedinCaption("");
    setByuTemplate("");
    setPosted({ instagram: false, linkedin: false });
    setScheduled(false);

    try {
      // Step 1: Speaker lookup (only if speaker name provided)
      let resolvedSpeaker = null;
      if (speakerName.trim()) {
        setCurrentStep("speaker");
        const speakerRes = await fetch("/api/admin/marketing/speaker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            speakerName: speakerName.trim(),
            eventDescription: selectedEvent.description || selectedEvent.summary,
          }),
        });
        const speakerData = await speakerRes.json();
        if (speakerData.speakerInfo) {
          resolvedSpeaker = speakerData.speakerInfo;
          setSpeakerInfo(resolvedSpeaker);
        }
      }
      completeStep("speaker");

      // Steps 2 & 3: Generate flyer + captions in one call
      setCurrentStep("flyer");
      const genRes = await fetch("/api/admin/marketing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventData: selectedEvent, speakerInfo: resolvedSpeaker }),
      });

      if (!genRes.ok) {
        const err = await genRes.json();
        throw new Error(err.error || "Generation failed");
      }

      const genData = await genRes.json();

      if (genData.flyerBase64) {
        setFlyerBase64(genData.flyerBase64);
        setFlyerMimeType(genData.flyerMimeType || "image/png");
      }
      if (genData.palette) setPalette(genData.palette);
      if (genData.campaignId) setCampaignId(genData.campaignId);

      completeStep("flyer");
      setCurrentStep("captions");

      setInstagramCaption(genData.instagramCaption || "");
      setLinkedinCaption(genData.linkedinCaption || "");
      setByuSubject(genData.byuSubject || "");
      setByuTemplate(genData.byuTemplate || "");
      completeStep("captions");
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setRunning(false);
      setCurrentStep(null);
    }
  }

  async function handlePostInstagram() {
    if (!flyerBase64) return;
    setPosting(p => ({ ...p, instagram: true }));
    setPostError(null);
    try {
      // For Instagram we need a public URL — if we don't have a stored URL yet,
      // we send base64 and let the API upload it. Fallback: use a data URL note.
      const res = await fetch("/api/admin/marketing/post-instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: flyerBase64,
          caption: instagramCaption,
          campaignId,
          postType: "feed",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Instagram post failed");
      setPosted(p => ({ ...p, instagram: true }));
    } catch (err) {
      setPostError(`Instagram: ${err.message}`);
    } finally {
      setPosting(p => ({ ...p, instagram: false }));
    }
  }

  async function handlePostLinkedIn() {
    if (!flyerBase64) return;
    setPosting(p => ({ ...p, linkedin: true }));
    setPostError(null);
    try {
      const res = await fetch("/api/admin/marketing/post-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: flyerBase64, caption: linkedinCaption, campaignId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "LinkedIn post failed");
      setPosted(p => ({ ...p, linkedin: true }));
    } catch (err) {
      setPostError(`LinkedIn: ${err.message}`);
    } finally {
      setPosting(p => ({ ...p, linkedin: false }));
    }
  }

  async function handleScheduleStory() {
    if (!selectedEvent) return;
    setScheduling(true);
    setPostError(null);
    const scheduledFor = eventDateISO(selectedEvent);
    try {
      const res = await fetch("/api/admin/marketing/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, scheduledFor, platform: "instagram" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scheduling failed");
      setScheduled(true);
    } catch (err) {
      setPostError(`Schedule: ${err.message}`);
    } finally {
      setScheduling(false);
    }
  }

  const hasResults = flyerBase64 || instagramCaption || linkedinCaption || byuTemplate;
  const flyerDataUrl = flyerBase64 ? `data:${flyerMimeType};base64,${flyerBase64}` : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[color:var(--byu-blue)]">Marketing Agent</h2>
        <p className="text-sm text-gray-500 mt-1">
          Select an event, optionally add a speaker, and let the agent generate a flyer + social posts automatically.
        </p>
      </div>

      {/* ── Step 1: Pick an event ─────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          1 · Select Event
        </h3>

        {eventsLoading ? (
          <p className="text-sm text-gray-400">Loading events…</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-gray-400">No upcoming events found in Google Calendar.</p>
        ) : (
          <div className="grid gap-2 max-h-60 overflow-y-auto pr-1">
            {events.map(event => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`text-left rounded-lg border px-4 py-3 transition-colors ${
                  selectedEvent?.id === event.id
                    ? "border-[color:var(--byu-blue)] bg-blue-50 text-[color:var(--byu-blue)]"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="font-medium text-sm">{event.summary || "Untitled Event"}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {formatDisplayDate(event)} · {formatDisplayTime(event)}
                  {event.location && ` · ${event.location}`}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Step 2: Speaker ───────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          2 · Guest Speaker <span className="normal-case font-normal text-gray-400">(optional)</span>
        </h3>
        <input
          type="text"
          placeholder="e.g. Jane Smith"
          value={speakerName}
          onChange={e => setSpeakerName(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <p className="text-xs text-gray-400 mt-1.5">
          Agent will search LinkedIn for their title, company, and bio to include in the flyer.
        </p>
      </div>

      {/* ── Run button ────────────────────────────────────────────── */}
      <button
        onClick={runAgent}
        disabled={!selectedEvent || running}
        className="w-full py-3 rounded-xl font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: "var(--byu-blue)" }}
      >
        {running ? "Running Agent…" : "⚡ Run Marketing Agent"}
      </button>

      {/* ── Progress steps ────────────────────────────────────────── */}
      {(running || completedSteps.length > 0) && (
        <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />
      )}

      {/* ── Error ────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────── */}
      {hasResults && (
        <div className="space-y-5">
          {/* Palette badge */}
          {palette && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>This week's palette:</span>
              <span
                className="px-2 py-0.5 rounded-full text-white font-medium text-xs"
                style={{ backgroundColor: palette.bg }}
              >
                {palette.name}
              </span>
              <span className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: palette.accent }} />
            </div>
          )}

          {/* Speaker info */}
          {speakerInfo && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm">
              <span className="font-semibold text-[color:var(--byu-blue)]">{speakerInfo.name}</span>
              {speakerInfo.title && <span className="text-gray-600"> · {speakerInfo.title}</span>}
              {speakerInfo.company && <span className="text-gray-500"> at {speakerInfo.company}</span>}
              {speakerInfo.bio && <p className="text-gray-600 mt-1 text-xs">{speakerInfo.bio}</p>}
              {speakerInfo.linkedinUrl && (
                <a href={speakerInfo.linkedinUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                  View LinkedIn ↗
                </a>
              )}
            </div>
          )}

          {/* Two-column layout: flyer + captions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Flyer preview */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Generated Flyer</h4>
                {flyerDataUrl && (
                  <a
                    href={flyerDataUrl}
                    download={`flyer-${selectedEvent?.summary?.replace(/\s+/g, '-').toLowerCase() || 'event'}.png`}
                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                  >
                    Download
                  </a>
                )}
              </div>
              {flyerDataUrl ? (
                <img
                  src={flyerDataUrl}
                  alt="Generated event flyer"
                  className="w-full rounded-lg border border-gray-100 object-cover"
                />
              ) : (
                <div className="w-full aspect-square rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-400">
                  Flyer generation failed — captions still ready below
                </div>
              )}
            </div>

            {/* Captions */}
            <div className="space-y-4">
              <CaptionCard
                label="Instagram"
                icon="📸"
                value={instagramCaption}
                onChange={setInstagramCaption}
              />
              <CaptionCard
                label="LinkedIn"
                icon="💼"
                value={linkedinCaption}
                onChange={setLinkedinCaption}
              />
            </div>
          </div>

          {/* BYU club announcement */}
          {byuTemplate && (
            <div className="border border-gray-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">📋 BYU Club Announcement</h4>
                <CopyButton text={`Subject: ${byuSubject}\n\n${byuTemplate}`} label="Copy All" />
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-1.5 flex items-center gap-2">
                <span className="font-medium text-gray-700">Subject:</span>
                {byuSubject}
                <CopyButton text={byuSubject} label="Copy" />
              </div>
              <textarea
                value={byuTemplate}
                onChange={e => setByuTemplate(e.target.value)}
                rows={8}
                className="w-full text-sm text-gray-800 border border-gray-100 rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-blue-300 font-mono"
              />
              <p className="text-xs text-gray-400">
                Copy and paste into the BYU club announcement system.
              </p>
            </div>
          )}

          {/* Post + Schedule actions */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Publish</h4>

            {postError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                {postError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Instagram feed */}
              <button
                onClick={handlePostInstagram}
                disabled={posting.instagram || posted.instagram || !flyerBase64}
                className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  posted.instagram
                    ? "bg-green-100 text-green-700"
                    : "bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200"
                }`}
              >
                {posted.instagram ? "✓ Posted to Instagram" : posting.instagram ? "Posting…" : "📸 Post to Instagram"}
              </button>

              {/* LinkedIn feed */}
              <button
                onClick={handlePostLinkedIn}
                disabled={posting.linkedin || posted.linkedin || !flyerBase64}
                className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  posted.linkedin
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                }`}
              >
                {posted.linkedin ? "✓ Posted to LinkedIn" : posting.linkedin ? "Posting…" : "💼 Post to LinkedIn"}
              </button>

              {/* Schedule 8 AM story */}
              <button
                onClick={handleScheduleStory}
                disabled={scheduling || scheduled || !selectedEvent}
                className={`py-2.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  scheduled
                    ? "bg-green-100 text-green-700"
                    : "bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                }`}
              >
                {scheduled ? "✓ Story Scheduled" : scheduling ? "Scheduling…" : "⏰ Schedule 8 AM Story"}
              </button>
            </div>

            {selectedEvent && (
              <p className="text-xs text-gray-400">
                Story will post at 8:00 AM on{" "}
                <strong>{formatDisplayDate(selectedEvent)}</strong> (day of event).
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
