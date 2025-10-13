"use client";
import { useEffect, useState } from "react";

export default function AudienceManager() {
  const [audiences, setAudiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", createOnResend: true });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadAudiences() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audiences', {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setAudiences(data.audiences || []);
      } else {
        setError(data.error || 'Failed to load audiences');
      }
    } catch (e) {
      setError('Failed to load audiences');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAudiences();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.name.trim()) {
      setError('Please provide a name');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/audiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: form.name.trim(), createOnResend: form.createOnResend })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save audience');
        return;
      }
      setSuccess('Audience saved');
      setForm({ name: "", createOnResend: true });
      await loadAudiences();
    } catch (e) {
      setError('Unexpected error saving audience');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-[color:var(--byu-blue)] mb-6">Manage Audiences</h2>

      <form onSubmit={onSubmit} className="space-y-4 border p-4 rounded-md bg-white">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
            placeholder="e.g., AI in Healthcare"
            required
          />
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.createOnResend}
            onChange={(e) => setForm(prev => ({ ...prev, createOnResend: e.target.checked }))}
          />
          <span>Create audience in Resend</span>
        </label>
        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-700">{success}</div>}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-[color:var(--byu-blue)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Audience'}
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-3">Existing Audiences</h3>
        {loading ? (
          <div className="text-sm text-gray-600">Loading...</div>
        ) : (
          <div className="border rounded-md divide-y">
            {audiences.map(a => (
              <div key={a.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-gray-500">ID: {a.id}{a.resend_id ? ` · Resend: ${a.resend_id}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


