"use client";

import { useState, useEffect } from "react";

export default function StarTierManager() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [form, setForm] = useState({ tier_name: "", min_stars: 0, badge_emoji: "⭐", sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadTiers();
  }, []);

  async function loadTiers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/star-tiers");
      const data = await res.json();
      setTiers(data.data || []);
    } catch {
      setMessage({ type: "error", text: "Failed to load tiers" });
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingTier(null);
    setForm({ tier_name: "", min_stars: 0, badge_emoji: "⭐", sort_order: 0 });
    setShowForm(true);
  }

  function openEdit(tier) {
    setEditingTier(tier);
    setForm({
      tier_name: tier.tier_name,
      min_stars: tier.min_stars,
      badge_emoji: tier.badge_emoji || "⭐",
      sort_order: tier.sort_order || 0,
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const method = editingTier ? "PUT" : "POST";
      const body = editingTier ? { ...form, id: editingTier.id } : form;
      const res = await fetch("/api/admin/star-tiers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Save failed" });
        return;
      }
      setMessage({ type: "success", text: editingTier ? "Tier updated" : "Tier created" });
      setShowForm(false);
      setEditingTier(null);
      loadTiers();
    } catch {
      setMessage({ type: "error", text: "Unexpected error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this tier?")) return;
    try {
      const res = await fetch(`/api/admin/star-tiers?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Delete failed" });
        return;
      }
      setMessage({ type: "success", text: "Tier deleted" });
      setTiers((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setMessage({ type: "error", text: "Unexpected error" });
    }
  }

  if (loading) return <p className="py-8 text-center text-gray-500">Loading…</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[color:var(--byu-blue)]">Star Reward Tiers</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Set milestone thresholds that members reach as they earn stars.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openCreate}
            className="rounded-lg bg-[color:var(--byu-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            + Add Tier
          </button>
        )}
      </div>

      {message && (
        <p className={`text-sm font-medium ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
          {message.text}
        </p>
      )}

      {showForm && (
        <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h4 className="mb-4 font-semibold text-gray-800">
            {editingTier ? "Edit Tier" : "New Tier"}
          </h4>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tier Name *</label>
                <input
                  type="text"
                  value={form.tier_name}
                  onChange={(e) => setForm({ ...form, tier_name: e.target.value })}
                  required
                  placeholder="e.g. AI Explorer"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Badge Emoji</label>
                <input
                  type="text"
                  value={form.badge_emoji}
                  onChange={(e) => setForm({ ...form, badge_emoji: e.target.value })}
                  placeholder="⭐"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Minimum Stars *
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.min_stars}
                  onChange={(e) => setForm({ ...form, min_stars: parseInt(e.target.value, 10) || 0 })}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Sort Order</label>
                <input
                  type="number"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[color:var(--byu-blue)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : editingTier ? "Update Tier" : "Create Tier"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingTier(null); }}
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {tiers.length === 0 ? (
        <p className="text-gray-500">No tiers defined yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tiers.map((tier) => (
            <li
              key={tier.id}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
            >
              <span className="text-2xl">{tier.badge_emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{tier.tier_name}</p>
                <p className="text-sm text-gray-500">
                  Requires {tier.min_stars} ⭐ · Sort {tier.sort_order}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(tier)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(tier.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
