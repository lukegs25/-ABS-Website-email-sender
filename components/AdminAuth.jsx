"use client";
import { useState, useEffect, createContext, useContext } from "react";

// Create context for admin session
const AdminContext = createContext(null);

// Hook to use admin context
export function useAdmin() {
  return useContext(AdminContext);
}

function parseAdminTypes(adminType) {
  if (!adminType) return [];
  let adminTypes = [];
  if (Array.isArray(adminType)) {
    adminTypes = adminType;
  } else if (typeof adminType === "string") {
    try {
      const parsed = JSON.parse(adminType);
      if (Array.isArray(parsed)) {
        adminTypes = parsed;
      } else {
        adminTypes = adminType.split(",").map((t) => t.trim());
      }
    } catch {
      adminTypes = adminType.split(",").map((t) => t.trim());
    }
  }
  return adminTypes.filter(Boolean);
}

export default function AdminAuth({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminSession, setAdminSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    setChecking(true);
    try {
      // First, check if user is logged in via LinkedIn and has admin_type on their profile
      const linkedInRes = await fetch("/api/auth/user");
      if (linkedInRes.ok) {
        const linkedInData = await linkedInRes.json();
        if (linkedInData.user?.admin_type) {
          const adminTypes = parseAdminTypes(linkedInData.user.admin_type);
          setAdminSession({
            email: linkedInData.user.email,
            admin_type: linkedInData.user.admin_type,
            adminTypes,
            isSuperAdmin: adminTypes.some((t) => t.toLowerCase() === "superadmin"),
            authMethod: "linkedin",
          });
          setIsAuthenticated(true);
          setChecking(false);
          return;
        }
      }

      // Fallback: check cookie-based admin session (email/password login)
      const res = await fetch("/api/admin-login", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        const adminTypes = parseAdminTypes(data.admin_type);
        setAdminSession({
          email: data.email,
          admin_type: data.admin_type,
          adminTypes,
          isSuperAdmin: adminTypes.some((t) => t.toLowerCase() === "superadmin"),
          authMethod: "password",
        });
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setAdminSession(null);
      }
    } catch (e) {
      console.log("Error in checkAuth:", e);
      setIsAuthenticated(false);
      setAdminSession(null);
    } finally {
      setChecking(false);
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      const adminTypes = parseAdminTypes(data.admin_type);
      setAdminSession({
        email: email.trim().toLowerCase(),
        admin_type: data.admin_type,
        adminTypes,
        isSuperAdmin: adminTypes.some((t) => t.toLowerCase() === "superadmin"),
        authMethod: "password",
      });
      setIsAuthenticated(true);
    } catch (err) {
      setError("Unexpected error");
    }
  };

  // Show loading while checking auth
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[color:var(--byu-blue)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="max-w-md w-full space-y-8 p-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-[color:var(--byu-blue)]">
              Admin Access Required
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500">
              Sign in with your LinkedIn account if you have admin access, or use admin credentials below.
            </p>
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
