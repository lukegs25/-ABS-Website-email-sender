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
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [message, setMessage] = useState(null);
  const [memberSearch, setMemberSearch] = useState("");

  // New admin form
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("8");
  const [adding, setAdding] = useState(false);

  // Editing state
  const [editingEmail, setEditingEmail] = useState(null);
  const [editValue, setEditValue] = useState("");

  // Grant role from member list
  const [grantingEmail, setGrantingEmail] = useState(null);
  const [grantRole, setGrantRole] = useState("8");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/accounts");
      const data = await res.json();
      setAdmins(data.admins || []);
      setMembers(data.members || []);
    } catch {
      setMessage({ type: "error", text: "Failed to load accounts" });
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
        fetchData();
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
        setGrantingEmail(null);
        fetchData();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to update admin" });
    } finally {
      setSaving(null);
    }
  }

  function getRoleLabel(adminType) {
    if (!adminType) return "None";
    const str = Array.isArray(adminType) ? adminType.join(",") : String(adminType);
    if (str.toLowerCase() === "superadmin") return "Super Admin";
    const match = ROLE_OPTIONS.find((r) => r.value === str);
    return match ? match.label : str;
  }

  // Build a set of admin emails for quick lookup
  const adminEmails = new Set(admins.map((a) => a.email?.toLowerCase()));

  // Filter members by search
  const filteredMembers = members.filter((m) => {
    if (!memberSearch) return true;
    const q = memberSearch.toLowerCase();
    return (
      (m.full_name || "").toLowerCase().includes(q) ||
      (m.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[color:var(--byu-blue)]">
          Admin Accounts
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage admin roles. Grant access to LinkedIn members or add by email.
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

      {/* Current Admins */}
      <div className="mb-8">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Current Admins</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : admins.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-200 py-8 text-center">
            <p className="font-medium text-gray-600">No admin accounts found</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-700">Email</th>
                  <th className="px-4 py-3 font-medium text-gray-700">Role</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{admin.email}</td>
                    <td className="px-4 py-3">
                      {editingEmail === admin.email ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                          >
                            {ROLE_OPTIONS.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => updateAdmin(admin.email, editValue)}
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
                            String(admin.adminType || "").toLowerCase() === "superadmin"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {getRoleLabel(admin.adminType)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingEmail !== admin.email && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingEmail(admin.email);
                              setEditValue(String(admin.adminType || "8"));
                            }}
                            className="rounded-md px-3 py-1 text-xs font-medium text-[color:var(--byu-blue)] hover:bg-[color:var(--byu-blue)]/10"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove admin access for ${admin.email}?`)) {
                                updateAdmin(admin.email, "");
                              }
                            }}
                            disabled={saving === admin.email}
                            className="rounded-md px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add by email */}
      <div className="mb-8">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Add Admin by Email</h3>
        <form
          onSubmit={addAdmin}
          className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
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
      </div>

      {/* LinkedIn Members */}
      <div>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            LinkedIn Members
            {!loading && (
              <span className="ml-2 text-sm font-normal text-gray-400">({members.length})</span>
            )}
          </h3>
          <input
            type="text"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            placeholder="Search members..."
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)] sm:w-64"
          />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-48 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-200 py-8 text-center">
            <p className="font-medium text-gray-600">
              {memberSearch ? "No members match your search" : "No LinkedIn members found"}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredMembers.map((member) => {
              const isAdmin = adminEmails.has(member.email?.toLowerCase());
              const isGranting = grantingEmail === member.email;

              return (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-100 p-3 hover:bg-gray-50"
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--byu-blue)]/10 text-sm font-semibold text-[color:var(--byu-blue)]">
                      {(member.full_name || "?")[0]}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 truncate">
                        {member.full_name || "Unknown"}
                      </span>
                      {isAdmin && (
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          Admin
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 truncate block">{member.email}</span>
                  </div>

                  {isGranting ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={grantRole}
                        onChange={(e) => setGrantRole(e.target.value)}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => updateAdmin(member.email, grantRole)}
                        disabled={saving === member.email}
                        className="rounded-md bg-[color:var(--byu-blue)] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {saving === member.email ? "..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => setGrantingEmail(null)}
                        className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setGrantingEmail(member.email);
                        setGrantRole("8");
                      }}
                      className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        isAdmin
                          ? "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          : "bg-[color:var(--byu-blue)]/10 text-[color:var(--byu-blue)] hover:bg-[color:var(--byu-blue)]/20"
                      }`}
                    >
                      {isAdmin ? "Change Role" : "Make Admin"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
