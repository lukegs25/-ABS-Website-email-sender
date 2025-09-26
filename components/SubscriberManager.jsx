"use client";
import { useState, useEffect } from "react";

const AUDIENCE_NAMES = {
  8: "AI in Business (main)",
  7: "SCAI - Students", 
  6: "Finance",
  5: "Marketing",
  4: "Semi-conductors",
  9: "Accounting",
  3: "Etc/general",
  1: "SCAI - Teachers",
  2: "Teachers wanting to support students"
};

export default function SubscriberManager() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAudience, setSelectedAudience] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/subscribers');
      if (response.ok) {
        const data = await response.json();
        setSubscribers(data.subscribers);
        setStats(data.stats);
      } else {
        console.error('Failed to fetch subscribers');
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
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

  const exportSubscribers = () => {
    const csvData = filteredSubscribers.map(sub => ({
      email: sub.email,
      audience: AUDIENCE_NAMES[sub.audience_id] || `Audience ${sub.audience_id}`,
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
    a.download = `subscribers_${selectedAudience}_${new Date().toISOString().split('T')[0]}.csv`;
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
        <button
          onClick={exportSubscribers}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Export CSV
        </button>
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
            <option value="all">All Audiences</option>
            {Object.entries(AUDIENCE_NAMES).map(([id, name]) => (
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
                    {AUDIENCE_NAMES[subscriber.audience_id] || `Audience ${subscriber.audience_id}`}
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