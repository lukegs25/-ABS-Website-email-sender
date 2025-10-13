"use client";
import { useState, useEffect } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { useAdmin } from "@/components/AdminAuth";

export default function SubscriberManager() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudience, setSelectedAudience] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({});
  const [audienceNames, setAudienceNames] = useState({});
  const [uploadAudience, setUploadAudience] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const adminSession = useAdmin();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Set initial selectedAudience based on admin permissions
    if (adminSession && adminSession.admin_type !== 'SuperAdmin' && !adminSession.isSuperAdmin && selectedAudience === "all") {
      // For non-super admins, default to first available audience they have access to
      const filteredAudiences = getFilteredAudiences();
      if (filteredAudiences.length > 0) {
        setSelectedAudience(filteredAudiences[0][0]);
      }
    }
  }, [adminSession, audienceNames]);

  // Helper function to check if admin has access to an audience
  const hasAccessToAudience = (audienceName) => {
    if (!adminSession) return false;
    
    // SuperAdmin has access to all
    if (adminSession.isSuperAdmin || adminSession.admin_type === 'SuperAdmin') return true;
    
    // Check if admin_type exists
    if (!adminSession.admin_type) return false;
    
    // Handle both array and string formats
    let adminTypes = [];
    
    if (Array.isArray(adminSession.admin_type)) {
      // Already an array like ["Accounting"]
      adminTypes = adminSession.admin_type.map(t => 
        String(t).trim().toLowerCase().replace(/\s+/g, '')
      );
    } else if (typeof adminSession.admin_type === 'string') {
      // String format like "accounting,marketing"
      adminTypes = adminSession.admin_type
        .split(',')
        .map(t => t.trim().toLowerCase().replace(/\s+/g, ''));
    } else {
      return false;
    }
    
    // Normalize audience name: lowercase, remove extra spaces
    const audienceNameNormalized = audienceName
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '');
    
    console.log('[hasAccessToAudience]', {
      audienceName,
      audienceNameNormalized,
      adminTypes,
      adminTypeRaw: adminSession.admin_type,
      match: adminTypes.some(type => 
        audienceNameNormalized.includes(type) || 
        type.includes(audienceNameNormalized) ||
        type === audienceNameNormalized
      )
    });
    
    // Check if audience name matches any of the admin types
    // Check both ways: type in audience name OR audience name in type OR exact match
    return adminTypes.some(type => 
      audienceNameNormalized.includes(type) || 
      type.includes(audienceNameNormalized) ||
      type === audienceNameNormalized
    );
  };

  // Get filtered audiences based on admin permissions
  const getFilteredAudiences = () => {
    const allAudiences = Object.entries(audienceNames);
    
    console.log('[getFilteredAudiences] Admin session:', adminSession);
    console.log('[getFilteredAudiences] All audiences:', allAudiences);
    
    if (!adminSession) return allAudiences;
    
    // SuperAdmin sees all
    if (adminSession.isSuperAdmin || adminSession.admin_type === 'SuperAdmin') {
      console.log('[getFilteredAudiences] SuperAdmin - returning all audiences');
      return allAudiences;
    }
    
    // Filter based on admin_type
    const filtered = allAudiences.filter(([id, name]) => hasAccessToAudience(name));
    console.log('[getFilteredAudiences] Filtered audiences:', filtered);
    return filtered;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [subscribersResponse, audiencesResponse] = await Promise.all([
        fetch('/api/admin/subscribers', { credentials: 'include' }),
        fetch('/api/admin/audiences', { credentials: 'include' })
      ]);

      if (subscribersResponse.ok) {
        const subscribersData = await subscribersResponse.json();
        setSubscribers(subscribersData.subscribers);
        setStats(subscribersData.stats);
      } else {
        console.error('Failed to fetch subscribers');
      }

      if (audiencesResponse.ok) {
        const audiencesData = await audiencesResponse.json();
        // Convert audiences array to a lookup object
        const audienceMap = {};
        audiencesData.audiences?.forEach(audience => {
          audienceMap[audience.id] = audience.name;
        });
        console.log(audienceMap);
        setAudienceNames(audienceMap);
      } else {
        console.error('Failed to fetch audiences');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = searchTerm === "" || 
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.major && sub.major.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAudience = selectedAudience === "all" || 
      sub.audience_id === parseInt(selectedAudience);
    
    return matchesSearch && matchesAudience;
  });

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const emailIndex = headers.findIndex(h => h.includes('email'));
    const majorIndex = headers.findIndex(h => h.includes('major'));
    const isStudentIndex = headers.findIndex(h => h.includes('student') || h.includes('role'));

    if (emailIndex === -1) {
      throw new Error('CSV must contain an "email" column');
    }

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const subscriber = {
        email: values[emailIndex]
      };

      if (majorIndex !== -1) {
        subscriber.major = values[majorIndex];
      }

      if (isStudentIndex !== -1) {
        const roleValue = values[isStudentIndex].toLowerCase();
        subscriber.is_student = roleValue.includes('student') || roleValue === 'true';
      }

      return subscriber;
    });
  };

  const downloadTemplate = () => {
    const templateContent = `email,major,is_student
example@byu.edu,Computer Science,true
teacher@byu.edu,Business,false
student@college.edu,Marketing,true`;

    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscriber_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (files) => {
    if (!uploadAudience) {
      alert('Please select an audience first');
      return;
    }

    if (files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const text = await file.text();
      const parsedSubscribers = parseCSV(text);

      if (parsedSubscribers.length === 0) {
        throw new Error('No valid subscribers found in CSV');
      }

      const response = await fetch('/api/admin/subscribers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          audienceId: uploadAudience,
          subscribers: parsedSubscribers
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload subscribers');
      }

      setUploadResult({
        success: true,
        message: data.message,
        inserted: data.inserted,
        skipped: data.skipped
      });

      // Refresh the subscriber list
      fetchData();
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setUploadResult({
        success: false,
        message: error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const exportSubscribers = () => {
    if (filteredSubscribers.length === 0) {
      alert('No subscribers to export');
      return;
    }

    const csvData = filteredSubscribers.map(sub => ({
      email: sub.email,
      audience: audienceNames[sub.audience_id] || `Audience ${sub.audience_id}`,
      major: sub.major || '',
      is_student: sub.is_student ? 'Student' : 'Teacher',
      created_at: new Date(sub.created_at).toLocaleDateString()
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const audienceName = selectedAudience === 'all' ? 'all_audiences' : audienceNames[selectedAudience] || `audience_${selectedAudience}`;
    a.download = `subscribers_${audienceName}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-8">Loading subscribers...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[color:var(--byu-blue)]">Subscriber Management</h2>
      </div>

      {/* CSV Upload Section */}
      <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-xl font-semibold text-[color:var(--byu-blue)] mb-4">
          Upload Subscribers from CSV
        </h3>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <p className="text-sm text-gray-600">
            Upload a CSV file with columns: <code className="bg-white px-2 py-1 rounded text-xs">email</code>, 
            <code className="bg-white px-2 py-1 rounded text-xs ml-1">major</code> (optional), 
            <code className="bg-white px-2 py-1 rounded text-xs ml-1">is_student</code> or <code className="bg-white px-2 py-1 rounded text-xs">role</code> (optional)
          </p>
          <button
            onClick={downloadTemplate}
            className="px-3 py-1.5 text-sm bg-white border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            📋 Download Template
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Audience
            </label>
            <select
              value={uploadAudience}
              onChange={(e) => setUploadAudience(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)] bg-white"
              disabled={uploading}
            >
              <option value="">Choose an audience...</option>
              {getFilteredAudiences().map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {!uploadAudience ? (
          <div className="p-10 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 text-center">
            <p className="text-gray-500 text-sm">
              ⚠️ Please select an audience above before uploading
            </p>
          </div>
        ) : (
          <FileUpload onChange={handleFileUpload} />
        )}

        {uploading && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-700">Uploading and processing CSV...</p>
          </div>
        )}

        {uploadResult && (
          <div className={`mt-4 p-4 rounded-md border ${
            uploadResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={uploadResult.success ? 'text-green-700' : 'text-red-700'}>
              {uploadResult.message}
            </p>
            {uploadResult.success && (
              <div className="mt-2 text-sm text-green-600">
                <p>✓ {uploadResult.inserted} new subscriber(s) added</p>
                {uploadResult.skipped > 0 && (
                  <p>⚠ {uploadResult.skipped} duplicate(s) skipped</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Export Section */}
      <div className="mb-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
        <h3 className="text-xl font-semibold text-green-700 mb-4">
          Download Subscribers
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Audience to Download
            </label>
            <select
              value={selectedAudience}
              onChange={(e) => setSelectedAudience(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              {(adminSession?.isSuperAdmin || adminSession?.admin_type === 'SuperAdmin') && (
                <option value="all">📊 All Audiences (Super Admin)</option>
              )}
              {getFilteredAudiences().map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={exportSubscribers}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium whitespace-nowrap"
          >
            📥 Download CSV
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          {selectedAudience === 'all' 
            ? `Download all ${filteredSubscribers.length} subscribers from all audiences`
            : `Download ${filteredSubscribers.length} subscriber(s) from ${audienceNames[selectedAudience] || 'selected audience'}`
          }
        </p>
        {!adminSession?.isSuperAdmin && adminSession?.admin_type !== 'SuperAdmin' && adminSession?.admin_type && (
          <p className="text-xs text-gray-500 mt-2">
            ℹ️ You have access to: {
              Array.isArray(adminSession.admin_type) 
                ? adminSession.admin_type.join(', ') 
                : typeof adminSession.admin_type === 'string' 
                  ? adminSession.admin_type.split(',').join(', ') 
                  : adminSession.admin_type
            }
          </p>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-700">Total Subscribers</h3>
          <p className="text-2xl font-bold text-[color:var(--byu-blue)]">{stats.total || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-700">Students</h3>
          <p className="text-2xl font-bold text-green-600">{stats.students || 0}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-700">Teachers</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.teachers || 0}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-700">Unique Emails</h3>
          <p className="text-2xl font-bold text-orange-600">{stats.uniqueEmails || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by email or major..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
          />
        </div>
        <div>
          <select
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
          >
            {(adminSession?.isSuperAdmin || adminSession?.admin_type === 'SuperAdmin') && (
              <option value="all">All Audiences</option>
            )}
            {getFilteredAudiences().map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-600 mb-4">
        Showing {filteredSubscribers.length} of {subscribers.length} subscribers
      </p>

      {/* Subscribers Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Audience
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Major
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubscribers.map((subscriber, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {subscriber.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {audienceNames[subscriber.audience_id] || `Audience ${subscriber.audience_id}`}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    subscriber.is_student 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {subscriber.is_student ? 'Student' : 'Teacher'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {subscriber.major || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(subscriber.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSubscribers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No subscribers found matching your criteria.
        </div>
      )}
    </div>
  );
}