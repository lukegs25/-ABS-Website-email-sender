"use client";
import { useState, useEffect, createContext, useContext } from "react";

// Create context for admin session
const AdminContext = createContext(null);

// Hook to use admin context
export function useAdmin() {
  return useContext(AdminContext);
}

export default function AdminAuth({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminSession, setAdminSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin-login', { method: 'GET' });
        if (!res.ok) {
          setIsAuthenticated(false);
          setAdminSession(null);
          return;
        }
        const data = await res.json();
        setAdminSession({
          email: data.email,
          admin_type: data.admin_type,
          isSuperAdmin: data.admin_type === 'SuperAdmin'
        });
        setIsAuthenticated(true);
      } catch (e) {
        setIsAuthenticated(false);
        setAdminSession(null);
      }
    };
    
    checkAuth();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      
      // Set admin session from response
      setAdminSession({
        email: email.trim().toLowerCase(),
        admin_type: data.admin_type,
        isSuperAdmin: data.admin_type === 'SuperAdmin'
      });
      setIsAuthenticated(true);
    } catch (err) {
      setError('Unexpected error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full space-y-8 p-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-[color:var(--byu-blue)]">
              Admin Access Required
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleAuth}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)] focus:border-[color:var(--byu-blue)]"
                placeholder="you@byu.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)] focus:border-[color:var(--byu-blue)]"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label className="mt-2 inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
                <span>Show password</span>
              </label>
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}
            <div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-[color:var(--byu-blue)] text-white font-semibold rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--byu-blue)] disabled:opacity-50"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AdminContext.Provider value={adminSession}>
      {children}
    </AdminContext.Provider>
  );
}