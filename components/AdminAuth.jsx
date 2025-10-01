"use client";
import { useState, useEffect } from "react";

export default function AdminAuth({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const checkAuth = () => {
      const cookies = document.cookie.split(';');
      const adminCookie = cookies.find(cookie => 
        cookie.trim().startsWith('admin_auth=')
      );
      
      if (adminCookie) {
        console.log('Found existing admin_auth cookie');
        setIsAuthenticated(true);
      }
    };
    
    checkAuth();
  }, []);

  const setCookie = (name, value, days = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    
    // Set cookie with proper attributes for both local and production
    const cookieString = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    document.cookie = cookieString;
    
    console.log('Set admin_auth cookie:', cookieString);
  };

  const handleAuth = (e) => {
    e.preventDefault();
    // Simple password check - in production, use proper authentication
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";
    
    if (password === adminPassword) {
      setIsAuthenticated(true);
      setError("");
      
      // Set the admin_auth cookie that the API expects
      setCookie('admin_auth', 'authenticated');
      console.log('Admin authentication successful - cookie set');
    } else {
      setError("Invalid password");
      setPassword("");
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)] focus:border-[color:var(--byu-blue)]"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
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

    return children;
}