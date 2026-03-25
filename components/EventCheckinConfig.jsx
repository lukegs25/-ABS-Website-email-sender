"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import {
  QrCode,
  RefreshCw,
  Download,
  Maximize2,
  X,
  ToggleLeft,
  ToggleRight,
  Users,
  CheckCircle,
  Clock,
} from "lucide-react";

const BASE_URL = "https://www.aiinbusinesssociety.org";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function EventCheckinConfig({ eventId, eventTitle }) {
  const [config, setConfig] = useState({
    checkin_code: "",
    checkin_enabled: false,
    checkin_start: "",
    checkin_end: "",
    checkin_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [fullScreen, setFullScreen] = useState(false);
  const canvasRef = useRef(null);

  const qrUrl =
    config.checkin_code && eventId
      ? `${BASE_URL}/checkin?event=${eventId}&code=${encodeURIComponent(config.checkin_code)}`
      : null;

  const fetchConfig = useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/events/${eventId}/checkin-config`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setConfig({
            checkin_code: data.data.checkin_code || "",
            checkin_enabled: data.data.checkin_enabled || false,
            checkin_start: data.data.checkin_start
              ? data.data.checkin_start.slice(0, 16)
              : "",
            checkin_end: data.data.checkin_end
              ? data.data.checkin_end.slice(0, 16)
              : "",
            checkin_count: data.data.checkin_count || 0,
          });
        }
      }
    } catch (e) {
      console.error("Failed to fetch check-in config:", e);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Refresh count periodically when enabled
  useEffect(() => {
    if (!config.checkin_enabled || !eventId) return;
    const interval = setInterval(fetchConfig, 15000);
    return () => clearInterval(interval);
  }, [config.checkin_enabled, eventId, fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    setResult(null);
    try {
      const res = await fetch(`/api/events/${eventId}/checkin-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          checkin_code: config.checkin_code,
          checkin_enabled: config.checkin_enabled,
          checkin_start: config.checkin_start || null,
          checkin_end: config.checkin_end || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ success: true, message: "Check-in settings saved." });
      } else {
        setResult({ error: data.error || "Failed to save" });
      }
    } catch {
      setResult({ error: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadQR = () => {
    const canvas = document.getElementById("qr-download-canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `checkin-qr-${eventTitle || eventId}.png`;
    a.click();
  };

  if (loading) {
    return (
      <div className="py-4 text-sm text-gray-500">Loading check-in settings…</div>
    );
  }

  return (
    <div className="space-y-6 rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--byu-blue)]/10">
          <QrCode size={18} className="text-[color:var(--byu-blue)]" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Check-In Settings</h3>
          {eventTitle && (
            <p className="text-xs text-gray-500">{eventTitle}</p>
          )}
        </div>
        {/* Live counter */}
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
          <Users size={13} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">{config.checkin_count}</span>
          <span className="text-xs text-gray-500">checked in</span>
        </div>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900">Enable Check-In</p>
          <p className="text-xs text-gray-500">Allow students to check in with the code below</p>
        </div>
        <button
          onClick={() => setConfig((c) => ({ ...c, checkin_enabled: !c.checkin_enabled }))}
          className="text-[color:var(--byu-blue)]"
          aria-label="Toggle check-in"
        >
          {config.checkin_enabled ? (
            <ToggleRight size={32} />
          ) : (
            <ToggleLeft size={32} className="text-gray-400" />
          )}
        </button>
      </div>

      {/* Check-in code */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Check-In Code</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={config.checkin_code}
            onChange={(e) => setConfig((c) => ({ ...c, checkin_code: e.target.value.toUpperCase() }))}
            placeholder="e.g. AI2026"
            maxLength={20}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm uppercase tracking-widest focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
          />
          <button
            type="button"
            onClick={() => setConfig((c) => ({ ...c, checkin_code: generateCode() }))}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            title="Generate random code"
          >
            <RefreshCw size={14} />
            Generate
          </button>
        </div>
      </div>

      {/* Time window */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            <Clock size={13} className="mr-1 inline" />
            Check-In Opens
          </label>
          <input
            type="datetime-local"
            value={config.checkin_start}
            onChange={(e) => setConfig((c) => ({ ...c, checkin_start: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
          />
          <p className="mt-1 text-xs text-gray-400">Leave blank for no start restriction</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            <Clock size={13} className="mr-1 inline" />
            Check-In Closes
          </label>
          <input
            type="datetime-local"
            value={config.checkin_end}
            onChange={(e) => setConfig((c) => ({ ...c, checkin_end: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
          />
          <p className="mt-1 text-xs text-gray-400">Leave blank for no end restriction</p>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-[color:var(--byu-blue)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
        {result && (
          <span
            className={`flex items-center gap-1 text-sm ${
              result.error ? "text-red-600" : "text-green-600"
            }`}
          >
            {!result.error && <CheckCircle size={14} />}
            {result.error || result.message}
          </span>
        )}
      </div>

      {/* QR Code */}
      {qrUrl && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">QR Code</p>
              <p className="text-xs text-gray-500 break-all mt-0.5">{qrUrl}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadQR}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                title="Download QR as PNG"
              >
                <Download size={12} />
                Download
              </button>
              <button
                onClick={() => setFullScreen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                title="Show full-screen QR"
              >
                <Maximize2 size={12} />
                Full Screen
              </button>
            </div>
          </div>

          <div className="flex justify-center rounded-lg bg-white p-4">
            <QRCodeSVG
              value={qrUrl}
              size={180}
              level="M"
              includeMargin
            />
          </div>

          {/* Hidden canvas for download */}
          <div className="hidden">
            <QRCodeCanvas
              id="qr-download-canvas"
              value={qrUrl}
              size={400}
              level="M"
              includeMargin
            />
          </div>
        </div>
      )}

      {!qrUrl && config.checkin_code === "" && (
        <p className="text-sm text-gray-400 italic">
          Enter a check-in code above to generate a QR code.
        </p>
      )}

      {/* Full-screen QR overlay */}
      {fullScreen && qrUrl && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90">
          <button
            onClick={() => setFullScreen(false)}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close full screen"
          >
            <X size={22} />
          </button>
          <div className="flex flex-col items-center gap-6">
            {eventTitle && (
              <h2 className="text-2xl font-bold text-white">{eventTitle}</h2>
            )}
            <div className="rounded-2xl bg-white p-6">
              <QRCodeSVG
                value={qrUrl}
                size={320}
                level="M"
                includeMargin
              />
            </div>
            <div className="text-center">
              <p className="text-white/70 text-sm">Code:</p>
              <p className="text-3xl font-mono font-bold tracking-widest text-white">
                {config.checkin_code}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
