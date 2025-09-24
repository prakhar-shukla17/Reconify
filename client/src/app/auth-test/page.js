"use client";

import { useState } from "react";

export default function AuthTestPage() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createTestUser = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "http://localhost:3000/api/test-auth/create-test-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setToken(result.token);
        setUser(result.user);
        localStorage.setItem("token", result.token);
        alert("Test user created and token saved!");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "http://localhost:3000/api/test-auth/refresh-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: "test@example.com",
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setToken(result.token);
        setUser(result.user);
        localStorage.setItem("token", result.token);
        alert("Token refreshed successfully!");
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    alert("Authentication cleared!");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Authentication Test
          </h1>
          <p className="text-gray-600">
            Create test user and token for development testing
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-6">Test Authentication</h2>

          <div className="space-y-6">
            <div className="flex space-x-4">
              <button
                onClick={createTestUser}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Test User"}
              </button>

              <button
                onClick={refreshToken}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh Token"}
              </button>

              <button
                onClick={clearAuth}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Clear Auth
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {user && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">
                  ✅ Authenticated
                </h3>
                <div className="text-green-800 space-y-1">
                  <p>
                    <strong>Name:</strong> {user.firstName} {user.lastName}
                  </p>
                  <p>
                    <strong>Email:</strong> {user.email}
                  </p>
                  <p>
                    <strong>Role:</strong> {user.role}
                  </p>
                  <p>
                    <strong>Tenant ID:</strong> {user.tenant_id}
                  </p>
                  <p>
                    <strong>Organization:</strong> {user.organization_name}
                  </p>
                </div>
              </div>
            )}

            {token && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">🔑 Token</h3>
                <p className="text-blue-800 text-sm break-all">{token}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">
            📋 How to Use
          </h3>

          <div className="space-y-2 text-yellow-800">
            <p>
              1. <strong>Create Test User</strong> - Creates a test user and
              generates a valid JWT token
            </p>
            <p>
              2. <strong>Refresh Token</strong> - Generates a new token if the
              current one expires
            </p>
            <p>
              3. <strong>Test Payment</strong> - Use the token to test the
              subscription payment flow
            </p>
            <p>
              4. <strong>Clear Auth</strong> - Remove the token and start fresh
            </p>
          </div>
        </div>

        <div className="mt-8 text-center space-x-4">
          <a
            href="/subscription"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Test Subscription Page
          </a>
          <a
            href="/api-test"
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold"
          >
            Test API Endpoints
          </a>
        </div>
      </div>
    </div>
  );
}

