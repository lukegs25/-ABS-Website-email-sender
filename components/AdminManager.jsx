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
  const [needsColumn, setNeedsColumn] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  // Grant role from member list
  const [grantingId, setGrantingId] = useState(null);
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
      if (data.needsColumn) setNeedsColumn(true);
    } catch {
      setMessage({ type: "error", text: "Failed to load accounts" });
    } finally {
      setLoading(false);
    }
  }

  async function updateAdmin(profileId, adminType) {
    setSaving(profileId);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, adminType }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
      } else {
        setMessage({
          type: "success",
          text: adminType
            ? `Granted ${getRoleLabel(adminType)} access`
            : `Removed admin access`,
        });
        setEditingId(null);
        setGrantingId(null);
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

  // Build a set of admin profile IDs for quick lookup
  const adminIds = new Set(admins.map((a) => a.id));

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
          Grant admin access to LinkedIn members. Admin access is tied to their LinkedIn profile.
        </p>
      </div>

      {/* Column warning */}
      {needsColumn && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Setup required:</strong> Add the admin_type column to your profiles table in Supabase:
          <code className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs">
            ALTER TABLE profiles ADD COLUMN admin_type text;
          </code>
        </div>
      )}

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
            <p className="mt-1 text-sm text-gray-500">
              Grant access to LinkedIn members below.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
              >
                {admin.avatar_url ? (
                  <img
                    src={admin.avatar_url}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--byu-blue)]/10 text-sm font-semibold text-[color:var(--byu-blue)]">
                    {(admin.full_name || "?")[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-gray-900 truncate block">
                    {admin.full_name || "Unknown"}
                  </span>
                  <span className="text-sm text-gray-500 truncate block">{admin.email}</span>
                </div>

                {editingId === admin.id ? (
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
                      onClick={() => updateAdmin(admin.id, editValue)}
                      disabled={saving === admin.id}
                      className="rounded-md bg-[color:var(--byu-blue)] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {saving === admin.id ? "..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        String(admin.admin_type || "").toLowerCase() === "superadmin"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {getRoleLabel(admin.admin_type)}
                    </span>
                    <button
                      onClick={() => {
                        setEditingId(admin.id);
                        setEditValue(String(admin.admin_type || "8"));
                      }}
                      className="rounded-md px-3 py-1 text-xs font-medium text-[color:var(--byu-blue)] hover:bg-[color:var(--byu-blue)]/10"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove admin access for ${admin.full_name || admin.email}?`)) {
                          updateAdmin(admin.id, "");
                        }
                      }}
                      disabled={saving === admin.id}
                      className="rounded-md px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
              const isAdmin = adminIds.has(member.id);
              const isGranting = grantingId === member.id;

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
                          {getRoleLabel(member.admin_type)}
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
                        onClick={() => updateAdmin(member.id, grantRole)}
                        disabled={saving === member.id}
                        className="rounded-md bg-[color:var(--byu-blue)] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
                      >
                        {saving === member.id ? "..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => setGrantingId(null)}
                        className="rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setGrantingId(member.id);
                        setGrantRole(isAdmin ? String(member.admin_type || "8") : "8");
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
