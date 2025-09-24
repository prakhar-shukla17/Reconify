"use client";

import { useState, useEffect } from "react";
import {
  getStoredToken,
  isTokenExpired,
  refreshToken,
  isAuthenticated,
  getUserFromToken,
} from "../../utils/authUtils";

export default function TokenTestPage() {
  const [token, setToken] = useState("");
  const [tokenInfo, setTokenInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTokenInfo();
  }, []);

  const loadTokenInfo = () => {
    const storedToken = getStoredToken();
    setToken(storedToken || "");

    if (storedToken) {
      const user = getUserFromToken(storedToken);
      const expired = isTokenExpired(storedToken);
      setTokenInfo({
        user,
        expired,
        isAuthenticated: isAuthenticated(),
      });
    } else {
      setTokenInfo(null);
    }
  };

  const handleRefreshToken = async () => {
    setLoading(true);
    setError(null);

    try {
      await refreshToken();
      loadTokenInfo();
      alert("Token refreshed successfully!");
    } catch (err) {
      setError("Failed to refresh token: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClearToken = () => {
    localStorage.removeItem("token");
    loadTokenInfo();
    alert("Token cleared!");
  };

  const handleCreateNewToken = async () => {
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
        localStorage.setItem("token", result.token);
        loadTokenInfo();
        alert("New token created and stored!");
      } else {
        setError("Failed to create token: " + result.error);
      }
    } catch (err) {
      setError("Failed to create token: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Token Debug Page
          </h1>
          <p className="text-gray-600">
            Debug JWT token issues and test authentication
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold mb-6">Token Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Token
              </label>
              <textarea
                value={token}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-xs"
                rows={3}
                placeholder="No token found"
              />
            </div>

            {tokenInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Token Status
                </h3>
                <div className="space-y-1 text-blue-800 text-sm">
                  <p>
                    <strong>Authenticated:</strong>{" "}
                    {tokenInfo.isAuthenticated ? "✅ Yes" : "❌ No"}
                  </p>
                  <p>
                    <strong>Expired:</strong>{" "}
                    {tokenInfo.expired ? "❌ Yes" : "✅ No"}
                  </p>
                  {tokenInfo.user && (
                    <>
                      <p>
                        <strong>User ID:</strong> {tokenInfo.user.userId}
                      </p>
                      <p>
                        <strong>Email:</strong> {tokenInfo.user.email}
                      </p>
                      <p>
                        <strong>Role:</strong> {tokenInfo.user.role}
                      </p>
                      <p>
                        <strong>Tenant ID:</strong> {tokenInfo.user.tenant_id}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={handleRefreshToken}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh Token"}
              </button>

              <button
                onClick={handleCreateNewToken}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create New Token"}
              </button>

              <button
                onClick={handleClearToken}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Clear Token
              </button>

              <button
                onClick={loadTokenInfo}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Reload Info
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center space-x-4">
          <a
            href="/payment?plan_id=basic"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Test Payment Page
          </a>
          <a
            href="/auth-test"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold"
          >
            Auth Test Page
          </a>
        </div>
      </div>
    </div>
  );
}

