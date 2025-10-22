"use client";
import { useEffect, useState } from "react";
import { useAdmin } from "./AdminAuth";

export default function AudienceManager() {
  const adminSession = useAdmin();
  const [audiences, setAudiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", createOnResend: true });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Delete states
  const [deletingAudience, setDeletingAudience] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteResult, setDeleteResult] = useState(null);

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

  function handleDeleteClick(audience) {
    setDeleteTarget(audience);
    setShowDeleteConfirm(true);
    setDeleteResult(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    
    setDeletingAudience(true);
    setError("");
    
    try {
      const res = await fetch('/api/admin/audiences', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          audienceId: deleteTarget.id,
          audienceName: deleteTarget.name,
          resendId: deleteTarget.Resend_ID
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to delete audience');
        setDeletingAudience(false);
        return;
      }
      
      setDeleteResult(data.migrationStats);
      await loadAudiences();
      
      // Close modal after 3 seconds if successful
      setTimeout(() => {
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
        setDeleteResult(null);
      }, 3000);
      
    } catch (e) {
      setError('Unexpected error deleting audience');
    } finally {
      setDeletingAudience(false);
    }
  }

  function cancelDelete() {
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
    setDeleteResult(null);
    setError("");
  }

  const isSuperAdmin = adminSession?.isSuperAdmin || adminSession?.admin_type === 'SuperAdmin';

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
                  <div className="text-xs text-gray-500">ID: {a.id}{a.Resend_ID ? ` · Resend: ${a.Resend_ID}` : ''}</div>
                </div>
                {isSuperAdmin && a.id !== 8 && (
                  <button
                    onClick={() => handleDeleteClick(a)}
                    className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete audience"
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Delete Audience
            </h3>
            
            {!deleteResult ? (
              <>
                <div className="mb-6">
                  <p className="text-gray-700 mb-3">
                    Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800">
                    <p className="font-semibold mb-1">📧 Email Migration:</p>
                    <p>All subscribers will be checked for duplicates and non-duplicate emails will be automatically moved to the main ABS audience before deletion.</p>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={cancelDelete}
                    disabled={deletingAudience}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deletingAudience}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletingAudience ? 'Deleting...' : 'Delete Audience'}
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <p className="text-green-800 font-semibold mb-2">✅ Audience deleted successfully!</p>
                  
                  <div className="text-sm text-green-700 space-y-1">
                    <p>📊 Total subscribers in audience: <strong>{deleteResult.totalInAudience}</strong></p>
                    <p>✨ Migrated to main ABS: <strong>{deleteResult.migrated}</strong></p>
                    <p>🔄 Duplicates skipped: <strong>{deleteResult.duplicates}</strong></p>
                    {deleteResult.errors > 0 && (
                      <p className="text-orange-600">⚠️ Errors: <strong>{deleteResult.errors}</strong></p>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 text-center">
                  This dialog will close automatically...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


