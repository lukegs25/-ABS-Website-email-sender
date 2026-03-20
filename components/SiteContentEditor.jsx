"use client";

import { useState, useEffect } from "react";

const PAGES = [
  { id: "home", label: "Home" },
  { id: "student", label: "Student" },
  { id: "teacher", label: "Faculty" },
  { id: "global", label: "Global Settings" },
];

function ContentField({ row, onSave }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(row.content_value || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: row.page,
          section: row.section,
          content_key: row.content_key,
          content_value: value,
          content_type: row.content_type,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Save failed");
        return;
      }
      onSave({ ...row, content_value: value });
      setEditing(false);
    } catch {
      setError("Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono font-medium text-gray-500 mb-0.5">
          {row.section} / {row.content_key}
          <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">
            {row.content_type}
          </span>
        </p>
        {editing ? (
          <div className="flex flex-col gap-2">
            {row.content_type === "html" || row.content_value?.length > 100 ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none"
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none"
              />
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-[color:var(--byu-blue)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setEditing(false); setValue(row.content_value || ""); }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-800 break-words">
            {row.content_value || <span className="text-gray-400 italic">— empty —</span>}
          </p>
        )}
      </div>
      {!editing && (
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          Edit
        </button>
      )}
    </div>
  );
}

export default function SiteContentEditor() {
  const [activePage, setActivePage] = useState("home");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRow, setNewRow] = useState(null);
  const [newForm, setNewForm] = useState({ section: "", content_key: "", content_value: "", content_type: "text" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadContent(activePage);
  }, [activePage]);

  async function loadContent(page) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content?page=${page}`);
      const data = await res.json();
      setRows(data.data || []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  function handleFieldSave(updated) {
    setRows((prev) => prev.map((r) =>
      r.page === updated.page && r.section === updated.section && r.content_key === updated.content_key
        ? updated
        : r
    ));
    setMessage({ type: "success", text: "Content saved" });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleAddRow(e) {
    e.preventDefault();
    if (!newForm.section.trim() || !newForm.content_key.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: activePage, ...newForm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Save failed" });
        return;
      }
      setMessage({ type: "success", text: "Content added" });
      setNewRow(null);
      setNewForm({ section: "", content_key: "", content_value: "", content_type: "text" });
      loadContent(activePage);
    } catch {
      setMessage({ type: "error", text: "Unexpected error" });
    } finally {
      setSaving(false);
    }
  }

  // Group rows by section
  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.section]) grouped[row.section] = [];
    grouped[row.section].push(row);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-bold text-[color:var(--byu-blue)]">Site Content Editor</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Edit the text, labels, and copy displayed on each public page.
        </p>
      </div>

      {/* Page tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {PAGES.map((p) => (
          <button
            key={p.id}
            onClick={() => setActivePage(p.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activePage === p.id
                ? "border-[color:var(--byu-blue)] text-[color:var(--byu-blue)]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {message && (
        <p className={`text-sm font-medium ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
          {message.text}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.keys(grouped).length === 0 ? (
            <p className="text-gray-500">No content defined for this page yet.</p>
          ) : (
            Object.entries(grouped).map(([section, sectionRows]) => (
              <section key={section} className="rounded-xl border border-gray-200 bg-white p-5">
                <h4 className="mb-3 font-semibold text-gray-700 capitalize">
                  {section.replace(/_/g, " ")}
                </h4>
                <div className="divide-y divide-gray-100">
                  {sectionRows.map((row) => (
                    <ContentField
                      key={`${row.page}-${row.section}-${row.content_key}`}
                      row={row}
                      onSave={handleFieldSave}
                    />
                  ))}
                </div>
              </section>
            ))
          )}

          {/* Add new content row */}
          {newRow ? (
            <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
              <h4 className="mb-3 font-semibold text-gray-700">Add Content Field</h4>
              <form onSubmit={handleAddRow} className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Section</label>
                    <input
                      type="text"
                      value={newForm.section}
                      onChange={(e) => setNewForm({ ...newForm, section: e.target.value })}
                      required
                      placeholder="e.g. hero"
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Key</label>
                    <input
                      type="text"
                      value={newForm.content_key}
                      onChange={(e) => setNewForm({ ...newForm, content_key: e.target.value })}
                      required
                      placeholder="e.g. headline"
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Value</label>
                  <input
                    type="text"
                    value={newForm.content_value}
                    onChange={(e) => setNewForm({ ...newForm, content_value: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Type</label>
                  <select
                    value={newForm.content_type}
                    onChange={(e) => setNewForm({ ...newForm, content_type: e.target.value })}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                  >
                    <option value="text">text</option>
                    <option value="url">url</option>
                    <option value="html">html</option>
                    <option value="json">json</option>
                    <option value="image">image</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-[color:var(--byu-blue)] px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? "Adding…" : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRow(null)}
                    className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <button
              onClick={() => setNewRow(true)}
              className="rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm font-medium text-gray-500 hover:border-[color:var(--byu-blue)]/50 hover:text-[color:var(--byu-blue)]"
            >
              + Add Content Field
            </button>
          )}
        </div>
      )}
    </div>
  );
}
