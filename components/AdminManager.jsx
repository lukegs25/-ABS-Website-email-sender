"use client";

import { useState, useEffect } from "react";

const ROLE_OPTIONS = [
  { value: "SuperAdmin", label: "Super Admin", desc: "Full access to everything" },
  { value: "8", label: "AI in Business (main)", desc: "Audience 8" },
  { value: "9", label: "Accounting", desc: "Audience 9" },
  { value: "5", label: "Marketing", desc: "Audience 5" },
  { value: "6", label: "Finance", desc: "Audience 6" },
  { value: "7", label: "SCAI - Students", desc: "Audience 7" },
  { value: "1", label: "SCAI - Teachers", desc: "Audience 1" },
];

export default function AdminManager() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // email being saved
  const [message, setMessage] = useState(null);

  // New admin form
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("8");
  const [adding, setAdding] = useState(false);

  // Editing state
  const [editingEmail, setEditingEmail] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/accounts");
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch {
      setMessage({ type: "error", text: "Failed to load admin accounts" });
    } finally {
      setLoading(false);
    }
  }

  async function addAdmin(e) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setAdding(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim(), adminType: newRole }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
      } else {
        setMessage({ type: "success", text: `Admin access granted to ${newEmail}` });
        setNewEmail("");
        fetchAdmins();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to add admin" });
    } finally {
      setAdding(false);
    }
  }

  async function updateAdmin(email, adminType) {
    setSaving(email);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, adminType }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
      } else {
        setMessage({
          type: "success",
          text: adminType
            ? `Updated ${email} to ${adminType}`
            : `Removed admin access for ${email}`,
        });
        setEditingEmail(null);
        fetchAdmins();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update admin" });
    } finally {
      setSaving(null);
    }
  }

  function getRoleLabel(adminType) {
    if (!adminType) return "None";
    const lower = adminType.toLowerCase();
    if (lower === "superadmin") return "Super Admin";
    const match = ROLE_OPTIONS.find((r) => r.value === adminType);
    return match ? match.label : adminType;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[color:var(--byu-blue)]">
          Admin Accounts
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Grant or revoke admin access for subscribers. Users must exist in the
          subscriber list to be assigned admin roles.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            message.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add new admin */}
      <form
        onSubmit={addAdmin}
        className="mb-6 flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="user@example.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
            required
          />
        </div>
        <div className="sm:w-48">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Role
          </label>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={adding}
          className="shrink-0 rounded-lg bg-[color:var(--byu-blue)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {adding ? "Adding..." : "Grant Access"}
        </button>
      </form>

      {/* Admin list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg bg-gray-100"
            />
          ))}
        </div>
      ) : admins.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 py-12 text-center">
          <p className="font-medium text-gray-600">No admin accounts found</p>
          <p className="mt-1 text-sm text-gray-500">
            Use the form above to grant admin access.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">Email</th>
                <th className="px-4 py-3 font-medium text-gray-700">Role</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {admin.email}
                  </td>
                  <td className="px-4 py-3">
                    {editingEmail === admin.email ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            updateAdmin(admin.email, editValue)
                          }
                          disabled={saving === admin.email}
                          className="rounded-md bg-[color:var(--byu-blue)] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {saving === admin.email ? "..." : "Save"}
                        </button>
                        <button
                          onClick={() => setEditingEmail(null)}
                          className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          admin.adminType?.toLowerCase() === "superadmin"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {getRoleLabel(admin.adminType)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {editingEmail !== admin.email && (
                        <>
                          <button
                            onClick={() => {
                              setEditingEmail(admin.email);
                              setEditValue(admin.adminType || "8");
                            }}
                            className="rounded-md px-3 py-1 text-xs font-medium text-[color:var(--byu-blue)] hover:bg-[color:var(--byu-blue)]/10"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Remove admin access for ${admin.email}?`
                                )
                              ) {
                                updateAdmin(admin.email, "");
                              }
                            }}
                            disabled={saving === admin.email}
                            className="rounded-md px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
